import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Building2, Mail, Phone, CreditCard } from 'lucide-react';

const IdCardPreview = ({ staff }) => {
  const {
    name = "Staff Name",
    role = "Staff Role",
    department = "Department",
    email = "email@example.com",
    phone = "+1 234 567 890",
    staff_id = "DD-2025-000",
    avatar_url,
    valid_until = new Date().getFullYear() + 1
  } = staff || {};

  // Construct profile URL for QR code
  const profileUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/staff/profile/${staff_id}`
    : `/staff/profile/${staff_id}`;

  return (
    <div 
      id="staff-id-card"
      className="relative w-[350px] h-[550px] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col font-sans border border-gray-200"
    >
      {/* Top Section - Dark Navy Header */}
      <div className="bg-[#1A3A5C] h-[100px] flex flex-col items-center justify-center text-white relative">
        <div className="text-2xl font-black tracking-tighter mb-1">
          DD<span className="text-blue-400">infoways</span>
        </div>
        <div className="text-[10px] tracking-[0.2em] font-medium uppercase opacity-80">
          Staff Identity Card
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 -mr-8 -mt-8 rounded-full"></div>
      </div>

      {/* Middle Section - Profile */}
      <div className="flex-1 flex flex-col items-center pt-8 px-6 bg-white">
        {/* Profile Image with Navy Border Ring */}
        <div className="relative mb-4">
          <div className="w-[124px] h-[124px] rounded-full border-2 border-[#1A3A5C] flex items-center justify-center overflow-hidden bg-gray-50">
            {avatar_url ? (
              <img 
                src={avatar_url} 
                alt={name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-[#1A3A5C] text-4xl font-bold">
                {name.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Name and Role */}
        <h2 className="text-2xl font-bold text-[#1A3A5C] text-center mb-1 leading-tight">
          {name}
        </h2>
        <p className="text-[#2E75B6] font-semibold text-sm uppercase tracking-wider mb-4">
          {role}
        </p>

        {/* Divider */}
        <div className="w-full h-[1px] bg-gray-100 mb-6"></div>

        {/* Details Grid */}
        <div className="w-full space-y-4">
          <div className="flex items-center gap-4 text-gray-600">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#2E75B6]">
              <Building2 size={16} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Department</p>
              <p className="text-sm font-semibold">{department}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-gray-600">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#2E75B6]">
              <Mail size={16} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Email</p>
              <p className="text-sm font-semibold truncate w-[220px]">{email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-gray-600">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#2E75B6]">
              <Phone size={16} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Phone</p>
              <p className="text-sm font-semibold">{phone}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-gray-600">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#2E75B6]">
              <CreditCard size={16} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Staff ID</p>
              <p className="text-sm font-bold text-[#1A3A5C]">{staff_id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Footer */}
      <div className="bg-gray-50 border-t border-gray-100 p-6 flex items-center justify-between relative">
        {/* QR Code */}
        <div className="bg-white p-1.5 rounded-lg shadow-sm border border-gray-100">
          <QRCodeSVG value={profileUrl} size={64} level="H" />
        </div>

        {/* Validity */}
        <div className="text-right">
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Valid Until</p>
          <p className="text-lg font-black text-[#1A3A5C] leading-none">{valid_until}</p>
        </div>

        {/* Website URL at absolute bottom */}
        <div className="absolute bottom-1 left-0 right-0 text-center">
          <p className="text-[8px] text-gray-300 font-medium tracking-[0.3em] uppercase">
            www.ddinfoways.com
          </p>
        </div>
      </div>
      
      {/* Side Color Bar */}
      <div className="absolute left-0 top-[100px] bottom-0 w-1 bg-[#1A3A5C]/10"></div>
    </div>
  );
};

export default IdCardPreview;
