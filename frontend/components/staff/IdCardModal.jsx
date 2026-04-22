"use client"

import React, { useRef, useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import IdCardPreview from "./IdCardPreview";
import { downloadAsPNG, downloadAsPDF } from "@/lib/generateIdCard";
import { Download, FileDown, Loader2, Printer } from "lucide-react";

const IdCardModal = ({ staff }) => {
  const cardRef = useRef(null);
  const [isDownloadingPNG, setIsDownloadingPNG] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  const handleDownloadPNG = async () => {
    if (!staff?.staff_id) return;
    setIsDownloadingPNG(true);
    try {
      await downloadAsPNG(cardRef, `DD-ID-${staff.staff_id}.png`);
    } catch (error) {
      console.error("Failed to download PNG", error);
    } finally {
      setIsDownloadingPNG(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!staff?.staff_id) return;
    setIsDownloadingPDF(true);
    try {
      await downloadAsPDF(cardRef, `DD-ID-${staff.staff_id}.pdf`);
    } catch (error) {
      console.error("Failed to download PDF", error);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Printer className="w-4 h-4" />
          Generate ID Card
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-gray-100 border-none shadow-2xl">
        <DialogHeader className="p-6 bg-white border-b">
          <DialogTitle className="text-xl font-bold text-[#1A3A5C]">
            Staff Identity Card
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-8 gap-8">
          {/* Preview Container - needed for html-to-image to target specifically */}
          <div className="scale-[0.85] sm:scale-100 origin-center transition-transform duration-300 shadow-2xl rounded-2xl overflow-hidden">
            <div ref={cardRef}>
              <IdCardPreview staff={staff} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col w-full gap-3 px-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={handleDownloadPNG} 
                disabled={isDownloadingPNG || isDownloadingPDF}
                className="w-full bg-[#2E75B6] hover:bg-[#2E75B6]/90 text-white font-semibold flex items-center justify-center gap-2"
              >
                {isDownloadingPNG ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                PNG
              </Button>

              <Button 
                onClick={handleDownloadPDF} 
                disabled={isDownloadingPNG || isDownloadingPDF}
                className="w-full bg-[#1A3A5C] hover:bg-[#1A3A5C]/90 text-white font-semibold flex items-center justify-center gap-2"
              >
                {isDownloadingPDF ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4" />
                )}
                PDF
              </Button>
            </div>
            
            <p className="text-[10px] text-center text-gray-400 mt-2">
              Standard CR80 size (85.6mm x 54mm) equivalent at 300DPI
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IdCardModal;
