import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Printer, X } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import PayslipDocument from './PayslipDocument';

const PayslipModal = ({ isOpen, onClose, payslip, staff, company }) => {
  const handleDownloadPDF = async () => {
    const element = document.getElementById('payslip-document');
    if (!element) return;

    try {
      // Convert HTML to PNG
      const dataUrl = await toPng(element, {
        quality: 1,
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123, // A4 height in pixels at 96 DPI
        backgroundColor: '#ffffff',
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Add the image to PDF
      const imgWidth = 210; // A4 width in mm
      const imgHeight = 297; // A4 height in mm
      const img = new Image();
      img.src = dataUrl;

      pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight);

      // Download the PDF
      const fileName = `payslip_${staff?.name || payslip.name}_${payslip.month}_${payslip.year}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('payslip-document');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payslip - ${staff?.name || payslip.name}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: system-ui, -apple-system, sans-serif;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Payslip Preview</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <PayslipDocument payslip={payslip} staff={staff} company={company} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PayslipModal;