"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import api from '@/lib/api';
import PayslipDocument from '@/components/payslip/PayslipDocument';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export default function PayslipPage() {
  const params = useParams();
  const [payslip, setPayslip] = useState(null);
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, payslipRes] = await Promise.all([
          api.get('/auth/me'),
          api.get(`/payslip/${params.id}`)
        ]);

        setUser(userRes.data.data);

        // Check permissions - admin only
        if (userRes.data.data.role !== 'admin') {
          toast.error('Access denied. Admin only.');
          return;
        }

        const payslipData = payslipRes.data.data;
        setPayslip(payslipData);

        // Get staff details
        const staffRes = await api.get(`/staff/${payslipData.user_id}`);
        setStaff(staffRes.data.data);

      } catch (error) {
        console.error('Failed to fetch payslip:', error);
        toast.error('Failed to load payslip');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

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

      pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight);

      // Download the PDF
      const fileName = `payslip_${staff?.name || payslip.name}_${payslip.month}_${payslip.year}.pdf`;
      pdf.save(fileName);

      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error generating PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-[800px] w-full" />
        </div>
      </div>
    );
  }

  if (!payslip) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Payslip Not Found</h1>
          <p className="text-gray-600">The requested payslip could not be found.</p>
        </div>
      </div>
    );
  }

  const company = {
    name: 'DDinfoways Ltd',
    address: '123 Business Street, Auckland, New Zealand',
    phone: '+64 9 123 4567',
    email: 'info@ddinfoways.co.nz'
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#1A3A5C]">
            Payslip - {staff?.name || payslip.name}
          </h1>
          <Button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-[#1A3A5C] hover:bg-[#1A3A5C]/90 text-white"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <PayslipDocument
            payslip={payslip}
            staff={staff}
            company={company}
          />
        </div>
      </div>
    </div>
  );
}