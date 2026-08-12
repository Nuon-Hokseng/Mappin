import React, { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { Upload, Loader2 } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setStatus('Initializing OCR engine...');

    try {
      setStatus('Enhancing image for OCR...');
      
      // Image preprocessing: Scale up 2x and Grayscale to reduce monitor moiré patterns
      const processedCanvas = await new Promise<HTMLCanvasElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scale = 2; // Upscale for better OCR
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('No context');
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            const avg = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = avg;     // R
            data[i + 1] = avg; // G
            data[i + 2] = avg; // B
          }
          ctx.putImageData(imageData, 0, 0);
          resolve(canvas);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      const worker = await createWorker('eng', 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
            setStatus('Reading coordinates...');
          }
        },
      });

      // PSM 6: Assume a single uniform block of text. 
      // Removed whitelist because forcing numbers causes it to drop characters entirely instead of misreading as letters.
      await worker.setParameters({
        tessedit_pageseg_mode: '6' as any,
      });
      
      setStatus('Detecting text from image...');
      // Tesseract can accept a canvas directly!
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

      {!isProcessing ? (
        <Button
          variant="outline"
          className="w-full flex gap-2 items-center justify-center py-4 border-dashed border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={20} />
          <span>Upload Image</span>
        </Button>
      ) : (
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
    </div>
  );
}
