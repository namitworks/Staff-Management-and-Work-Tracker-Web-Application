import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Printer, Repeat } from 'lucide-react';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import IdCardDocument from './IdCardDocument';

export default function IdCardModal({ isOpen, onClose, staff }) {
  const [side, setSide] = useState('front');
  const [isDownloadingFront, setIsDownloadingFront] = useState(false);
  const [isDownloadingBack, setIsDownloadingBack] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Refs for off-screen rendering
  const frontRef = useRef(null);
  const backRef = useRef(null);

  if (!staff) return null;

  const formatValidUntil = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-NZ', { month: 'short', year: 'numeric' });
  };

  const handleDownloadImage = async (downloadSide) => {
    try {
      if (downloadSide === 'front') setIsDownloadingFront(true);
      if (downloadSide === 'back') setIsDownloadingBack(true);

      const ref = downloadSide === 'front' ? frontRef : backRef;
      if (!ref.current) throw new Error('Card reference not found');

      // html-to-image toPng
      const dataUrl = await toPng(ref.current, { cacheBust: true, pixelRatio: 2 });
      
      const link = document.createElement('a');
      link.download = `DDinfoways-ID-${staff.name.replace(/\s+/g, '')}-${staff.staff_id}-${downloadSide === 'front' ? 'Front' : 'Back'}.png`;
      link.href = dataUrl;
      link.click();

      toast.success(`${downloadSide === 'front' ? 'Front' : 'Back'} side downloaded successfully`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image. Please try again.');
    } finally {
      setIsDownloadingFront(false);
      setIsDownloadingBack(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      
      if (!frontRef.current || !backRef.current) throw new Error('Card references not found');

      const frontDataUrl = await toPng(frontRef.current, { cacheBust: true, pixelRatio: 2 });
      const backDataUrl = await toPng(backRef.current, { cacheBust: true, pixelRatio: 2 });

      // ID Card dimensions in mm (CR80 is ~54x86mm)
      // We'll use custom size close to CR80
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [54, 86]
      });

      pdf.addImage(frontDataUrl, 'PNG', 0, 0, 54, 86);
      pdf.addPage([54, 86], 'portrait');
      pdf.addImage(backDataUrl, 'PNG', 0, 0, 54, 86);

      pdf.save(`DDinfoways-ID-${staff.name.replace(/\s+/g, '')}-${staff.staff_id}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-2xl bg-slate-50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">
            Staff ID Card — {staff.name}
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            Staff ID: <span className="font-semibold text-slate-700">{staff.staff_id}</span> | 
            Valid Until: <span className="font-semibold text-slate-700">{formatValidUntil(staff.valid_until)}</span>
          </p>
        </DialogHeader>

        <div className="flex flex-col items-center mt-4">
          
          {/* Toggle Buttons */}
          <div className="flex bg-slate-200 p-1 rounded-lg mb-6">
            <button
              onClick={() => setSide('front')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                side === 'front' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Front
            </button>
            <button
              onClick={() => setSide('back')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                side === 'back' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Back
            </button>
          </div>

          {/* Flip Card Container */}
          <div style={{ perspective: '1000px', width: '340px', height: '540px' }} className="mb-8">
            <div
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                transition: 'transform 0.6s',
                transformStyle: 'preserve-3d',
                transform: side === 'front' ? 'rotateY(0deg)' : 'rotateY(180deg)'
              }}
            >
              <div style={{ backfaceVisibility: 'hidden', position: 'absolute', top: 0, left: 0 }}>
                <IdCardDocument side="front" staff={staff} />
              </div>
              <div style={{ backfaceVisibility: 'hidden', position: 'absolute', top: 0, left: 0, transform: 'rotateY(180deg)' }}>
                <IdCardDocument side="back" staff={staff} />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
            <Button 
              variant="outline" 
              onClick={() => handleDownloadImage('front')} 
              disabled={isDownloadingFront}
              className="text-xs"
            >
              {isDownloadingFront ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Front (PNG)
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => handleDownloadImage('back')} 
              disabled={isDownloadingBack}
              className="text-xs"
            >
              {isDownloadingBack ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Back (PNG)
            </Button>
            
            <Button 
              onClick={handleDownloadPdf} 
              disabled={isDownloadingPdf}
              className="text-xs bg-[#1A3A5C] hover:bg-[#2E75B6]"
            >
              {isDownloadingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              PDF (Both)
            </Button>
            
            <Button 
              variant="secondary" 
              onClick={handlePrint}
              className="text-xs"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>

        </div>
      </DialogContent>

      {/* Hidden Render for PDF/PNG Generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div id="idcard-print-area">
          <div ref={frontRef} style={{ marginBottom: '20px' }}>
            <IdCardDocument side="front" staff={staff} />
          </div>
          <div ref={backRef}>
            <IdCardDocument side="back" staff={staff} />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
