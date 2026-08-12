import React, { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { Upload, Loader2, Camera, Crop as CropIcon } from 'lucide-react';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { UTMCoordinate } from '@/types';
import { parseOCRText } from '@/lib/ocr/parser';
import { Button } from '@/components/ui/Button';

interface CoordinateUploaderProps {
  onCoordinatesExtracted: (coords: UTMCoordinate[]) => void;
}

export function CoordinateUploader({ onCoordinatesExtracted }: CoordinateUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  
  // Cropping states
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const imageRef = useRef<HTMLImageElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener('load', () => setImageSrc(reader.result?.toString() || null));
    reader.readAsDataURL(file);
    
    // Reset inputs so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const cancelCrop = () => {
    setImageSrc(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  const processCroppedImage = async () => {
    if (!imageSrc || !imageRef.current) return;

    setIsProcessing(true);
    setProgress(0);
    setStatus('Initializing OCR engine...');

    try {
      setStatus('Enhancing image for OCR...');
      
      const processedCanvas = await new Promise<HTMLCanvasElement>((resolve, reject) => {
        const img = imageRef.current!;
        let cropWidth, cropHeight, cropX, cropY;
        
        if (completedCrop && completedCrop.width && completedCrop.height) {
          const scaleX = img.naturalWidth / img.width;
          const scaleY = img.naturalHeight / img.height;
          cropWidth = completedCrop.width * scaleX;
          cropHeight = completedCrop.height * scaleY;
          cropX = completedCrop.x * scaleX;
          cropY = completedCrop.y * scaleY;
        } else {
          // Fallback to full image if no crop was drawn
          cropWidth = img.naturalWidth;
          cropHeight = img.naturalHeight;
          cropX = 0;
          cropY = 0;
        }

        // Target optimal resolution for OCR (max ~2000px on longest edge)
        const MAX_DIMENSION = 2000;
        const longestEdge = Math.max(cropWidth, cropHeight);
        const outScale = longestEdge > MAX_DIMENSION 
          ? (MAX_DIMENSION / longestEdge) 
          : (longestEdge < 1000 ? 2 : 1);

        const canvas = document.createElement('canvas');
        canvas.width = cropWidth * outScale;
        canvas.height = cropHeight * outScale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No context');
        
        ctx.drawImage(
          img,
          cropX, cropY, cropWidth, cropHeight,
          0, 0, canvas.width, canvas.height
        );
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const avg = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          let enhanced = avg;
          if (enhanced > 150) enhanced = Math.min(255, enhanced * 1.2);
          if (enhanced < 100) enhanced = Math.max(0, enhanced * 0.8);
          data[i] = enhanced;
          data[i + 1] = enhanced;
          data[i + 2] = enhanced;
        }
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas);
      });

      const worker = await createWorker('eng', 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
            setStatus('Reading coordinates...');
          }
        },
      });

      await worker.setParameters({
        tessedit_pageseg_mode: '6' as any,
      });
      
      setStatus('Detecting text from image...');
      const { data } = await worker.recognize(processedCanvas);
      const text = data.text;
      const words = (data.blocks || []).flatMap(block =>
        block.paragraphs.flatMap(paragraph =>
          paragraph.lines.flatMap(line => line.words)
        )
      );
      
      await worker.terminate();
      
      setStatus('Aligning tabular data...');
      const coords = parseOCRText(text, words);
      
      if (coords.length > 0) {
        onCoordinatesExtracted(coords);
      } else {
        alert("Failed to find coordinates. Raw OCR text was:\n\n" + text.substring(0, 500) + "\n\nPlease copy this and show it to the AI.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to process the image. Please try again.");
    } finally {
      setIsProcessing(false);
      setImageSrc(null);
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        accept="image/jpeg, image/png"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImageUpload}
        disabled={isProcessing}
      />
      <input
        type="file"
        accept="image/jpeg, image/png"
        capture="environment"
        className="hidden"
        ref={cameraInputRef}
        onChange={handleImageUpload}
        disabled={isProcessing}
      />

      {isProcessing && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={24} />
          <div className="text-sm font-medium text-gray-700">{status}</div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500">{progress}% complete</div>
        </div>
      )}

      {!isProcessing && imageSrc && (
        <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in duration-200">
          <div className="text-sm font-medium text-gray-700 text-center flex items-center justify-center gap-2">
            <CropIcon size={16} />
            Crop to the coordinate table
          </div>
          <div className="bg-gray-100 rounded-lg overflow-hidden flex justify-center items-center p-2 border border-gray-200">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              className="max-h-[50vh]"
            >
              <img
                ref={imageRef}
                alt="Crop me"
                src={imageSrc}
                className="max-h-[50vh] object-contain"
              />
            </ReactCrop>
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1 text-gray-600" onClick={cancelCrop}>Cancel</Button>
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={processCroppedImage}>Confirm Crop</Button>
          </div>
        </div>
      )}

      {!isProcessing && !imageSrc && (
        <div className="flex flex-col gap-3 w-full">
          <Button
            variant="outline"
            className="w-full flex gap-2 items-center justify-center py-6 border-dashed border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera size={24} />
            <span className="font-semibold">Scan with Camera</span>
          </Button>
          <Button
            variant="outline"
            className="w-full flex gap-2 items-center justify-center py-4 border-dashed border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={20} />
            <span>Upload Image</span>
          </Button>
        </div>
      )}
    </div>
  );
}
