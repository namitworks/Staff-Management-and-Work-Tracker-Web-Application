import React, { forwardRef } from 'react';
import { Mail, Phone, CreditCard, Building2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const IdCardDocument = forwardRef(({ side = 'front', staff = {}, company = {} }, ref) => {
  const safeStaff = {
    name: 'Not Assigned',
    role: 'N/A',
    department: 'N/A',
    staff_id: 'DD-YYYY-NNN',
    email: 'N/A',
    phone: 'N/A',
    avatar_url: null,
    blood_group: 'N/A',
    emergency_contact_name: 'Not provided',
    emergency_contact_phone: 'Not provided',
    valid_until: null,
    joining_date: null,
    ...staff,
  };

  const safeCompany = {
    name: 'DDinfoways Limited',
    address: '29 Henrietta Maxwell Grove, Wainuiomata, Lower Hutt 5014, New Zealand',
    email: 'info@ddinfoways.co.nz',
    website: 'ddinfoways.co.nz',
    profileBaseUrl: 'https://ddinfoways.co.nz/staff/',
    ...company,
  };

  const formatValidUntil = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-NZ', { month: 'short', year: 'numeric' });
  };

  const getInitials = (name) => {
    if (!name) return 'NA';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const qrUrl = `${safeCompany.profileBaseUrl}${safeStaff.staff_id}`;

  return (
    <div
      ref={ref}
      style={{
        width: '340px',
        height: '540px',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        fontFamily: '"Inter", sans-serif',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {side === 'front' ? (
        <>
          <div
            style={{
              width: '100%',
              height: '120px',
              background: 'linear-gradient(135deg, #1A3A5C 0%, #2E75B6 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              position: 'relative',
            }}
          >
            <div style={{ fontWeight: 'bold', fontSize: '20px', letterSpacing: '2px', marginBottom: '2px' }}>DDinfoways</div>
            <div style={{ fontWeight: 300, fontSize: '11px', letterSpacing: '4px', textTransform: 'uppercase' }}>LIMITED</div>
            <div style={{ width: '60%', height: '1px', backgroundColor: 'rgba(255,255,255,0.3)', margin: '8px 0' }} />
            <div style={{ fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase' }}>EMPLOYEE IDENTITY CARD</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-30px', zIndex: 10 }}>
            <div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                border: '3px solid #2E75B6',
                boxShadow: '0 0 0 3px white, 0 0 0 6px #2E75B6',
                backgroundColor: '#1A3A5C',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {safeStaff.avatar_url ? (
                <img
                  src={safeStaff.avatar_url}
                  alt={safeStaff.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  crossOrigin="anonymous"
                />
              ) : (
                <span style={{ color: 'white', fontSize: '36px', fontWeight: 'bold' }}>{getInitials(safeStaff.name)}</span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '24px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#1A3A5C', marginBottom: '2px' }}>{safeStaff.name}</div>
            <div style={{ fontWeight: 'normal', fontSize: '13px', color: '#2E75B6', letterSpacing: '0.5px' }}>{safeStaff.role}</div>
            <div style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>{safeStaff.department}</div>
          </div>

          <div style={{ height: '1px', backgroundColor: '#E2E8F0', margin: '14px 20px' }} />

          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Mail size={13} color="#2E75B6" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: '#718096', textTransform: 'uppercase', lineHeight: 1 }}>Email</span>
                <span style={{ fontSize: '11px', color: '#2D3748', marginTop: '2px', lineHeight: 1 }}>{safeStaff.email}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Phone size={13} color="#2E75B6" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: '#718096', textTransform: 'uppercase', lineHeight: 1 }}>Phone</span>
                <span style={{ fontSize: '11px', color: '#2D3748', marginTop: '2px', lineHeight: 1 }}>{safeStaff.phone}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CreditCard size={13} color="#2E75B6" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: '#718096', textTransform: 'uppercase', lineHeight: 1 }}>Staff ID</span>
                <span style={{ fontSize: '12px', color: '#1A3A5C', fontWeight: 'bold', marginTop: '2px', lineHeight: 1 }}>{safeStaff.staff_id}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building2 size={13} color="#2E75B6" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: '#718096', textTransform: 'uppercase', lineHeight: 1 }}>Dept</span>
                <span style={{ fontSize: '11px', color: '#2D3748', marginTop: '2px', lineHeight: 1 }}>{safeStaff.department}</span>
              </div>
            </div>
          </div>

          <div style={{ flexGrow: 1 }} />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px', marginTop: '16px' }}>
            <div style={{ backgroundColor: 'white', padding: '4px', border: '1px solid #E2E8F0', borderRadius: '4px' }}>
              <QRCodeSVG value={qrUrl} size={72} />
            </div>
            <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#1A3A5C', fontWeight: 'bold', marginTop: '4px' }}>{safeStaff.staff_id}</div>
            <div style={{ fontSize: '9px', color: '#718096', marginTop: '2px' }}>Scan to verify identity</div>
          </div>

          <div
            style={{
              width: '100%',
              height: '44px',
              backgroundColor: '#1A3A5C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ color: 'white', fontSize: '10px' }}>Valid Until: {formatValidUntil(safeStaff.valid_until)}</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '10px' }}>{safeCompany.website}</div>
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              width: '100%',
              height: '60px',
              background: 'linear-gradient(135deg, #1A3A5C 0%, #2E75B6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <div style={{ fontWeight: 'bold', fontSize: '14px', letterSpacing: '1px' }}>{safeCompany.name}</div>
          </div>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1, backgroundColor: 'white' }}>
            <div style={{ color: '#1A3A5C', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}>IMPORTANT NOTICE</div>
            <div style={{ color: '#718096', fontSize: '10px', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              This card is the property of {safeCompany.name}.<br />
              If found, please return to:<br />
              {safeCompany.address}<br />
              Tel: {safeCompany.email}
            </div>

            <div style={{ height: '1px', backgroundColor: '#E2E8F0', margin: '16px 0' }} />

            <div style={{ color: '#1A3A5C', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}>EMERGENCY CONTACT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', color: '#718096' }}>Name:</span>
                <span style={{ fontSize: '10px', color: '#2D3748', fontWeight: '500' }}>{safeStaff.emergency_contact_name || 'Not provided'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', color: '#718096' }}>Phone:</span>
                <span style={{ fontSize: '10px', color: '#2D3748', fontWeight: '500' }}>{safeStaff.emergency_contact_phone || 'Not provided'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', color: '#718096' }}>Blood Group:</span>
                <span style={{ fontSize: '10px', color: '#2D3748', fontWeight: '500' }}>{safeStaff.blood_group || 'Not provided'}</span>
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: '#E2E8F0', margin: '16px 0' }} />

            <div style={{ color: '#1A3A5C', fontWeight: 'bold', fontSize: '11px', marginBottom: '12px' }}>CARDHOLDER SIGNATURE</div>
            <div
              style={{
                width: '100%',
                height: '50px',
                border: '1px dashed #CBD5E0',
                borderRadius: '4px',
              }}
            />

            <div style={{ flexGrow: 1 }} />
          </div>

          <div
            style={{
              width: '100%',
              height: '30px',
              backgroundColor: '#1A3A5C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ color: 'white', fontSize: '9px' }}>Authorised by {safeCompany.name} HR Department</div>
          </div>
        </>
      )}
    </div>
  );
});

IdCardDocument.displayName = 'IdCardDocument';

export default IdCardDocument;
