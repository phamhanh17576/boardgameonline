// Bộ biểu tượng vẽ theo nét khắc gỗ (thay cho emoji). Lưới 24×24, nét mực đậm.
import type { CSSProperties, ReactElement } from 'react';

export type IconName =
  | 'lua'
  | 'go'
  | 'sat'
  | 'tien'
  | 'quan'
  | 'star'
  | 'dan'
  | 'vo'
  | 'thu'
  | 'muu'
  | 'khaiHoang'
  | 'thuThue'
  | 'chieuHien'
  | 'moBinh'
  | 'dieuQuan'
  | 'tanCong'
  | 'muuKe'
  | 'keSach'
  | 'tuyetKy'
  | 'ketThuc'
  | 'song'
  | 'nui'
  | 'rung'
  | 'ruong'
  | 'lang'
  | 'sach'
  | 'hoi'
  | 'roi'
  | 'chienTruong'
  | 'mo'
  | 'dong'
  | 'chienCong';

const P: Record<IconName, ReactElement> = {
  lua: (
    <>
      <path d="M12 22V10M12 13c-3-2-4-5-4-9M12 12c3-2 4.5-4.5 5-8M12 16c-2.5-1-4-3-5-5M12 17c2.5-1 4-3 5-5" />
      <ellipse cx="8" cy="5" rx="1.2" ry="2" fill="currentColor" />
      <ellipse cx="16.6" cy="5.5" rx="1.2" ry="2" fill="currentColor" transform="rotate(20 16.6 5.5)" />
      <ellipse cx="7" cy="11" rx="1.1" ry="1.8" fill="currentColor" transform="rotate(-30 7 11)" />
      <ellipse cx="17" cy="12" rx="1.1" ry="1.8" fill="currentColor" transform="rotate(30 17 12)" />
    </>
  ),
  go: (
    <>
      <path d="M5 8h12a4 4 0 0 1 0 8H5a4 4 0 0 1 0-8z" />
      <ellipse cx="17" cy="12" rx="2.4" ry="4" />
      <ellipse cx="17" cy="12" rx="0.9" ry="1.6" fill="currentColor" />
      <path d="M6 10.5h7M7 13.5h6" />
    </>
  ),
  sat: (
    <>
      <path d="M4 9c4-4 12-4 16 0" />
      <path d="M12 6v15" />
      <path d="M10 21h4" />
    </>
  ),
  tien: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <rect x="9.5" y="9.5" width="5" height="5" fill="currentColor" />
      <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2" />
    </>
  ),
  quan: (
    <>
      <path d="M5 8.5 12 3l7 5.5z" fill="currentColor" />
      <circle cx="12" cy="11" r="2.4" />
      <path d="M7.5 21c0-4 2-6.5 4.5-6.5s4.5 2.5 4.5 6.5" />
      <path d="M19 6v15" />
    </>
  ),
  star: <path d="m12 2.8 2.7 6 6.5.6-4.9 4.3 1.5 6.4L12 16.8l-5.8 3.3 1.5-6.4-4.9-4.3 6.5-.6z" fill="currentColor" />,
  dan: (
    <>
      <circle cx="8" cy="8" r="2.6" />
      <circle cx="16" cy="8" r="2.6" />
      <path d="M3 20c0-4 2.2-6.5 5-6.5S13 16 13 20M11 20c0-4 2.2-6.5 5-6.5S21 16 21 20" />
    </>
  ),
  vo: (
    <>
      <path d="M5 19 18 6l1-3-3 1L3 17" />
      <path d="M4 15l5 5M6 21l-3-3" />
    </>
  ),
  thu: <path d="M12 3 4.5 6v6c0 4.5 3.2 7.6 7.5 9 4.3-1.4 7.5-4.5 7.5-9V6z" />,
  muu: (
    <>
      <path d="M7 4h11v14a2.5 2.5 0 0 1-2.5 2.5H6" />
      <path d="M7 4a2 2 0 0 0-2 2v12.5A2 2 0 0 0 7 20.5" />
      <path d="M10 8.5h5M10 12h5M10 15.5h3" />
    </>
  ),
  khaiHoang: (
    <>
      <path d="M4 20 15 9" />
      <path d="M13 4l7 7-3 1-5-5z" fill="currentColor" />
      <path d="M3 21h8" />
    </>
  ),
  thuThue: (
    <>
      <path d="M3.5 11h17l-2 9h-13z" />
      <path d="M6 11c0-3 2.7-5 6-5s6 2 6 5" />
      <path d="M8 14.5h8" />
    </>
  ),
  chieuHien: (
    <>
      <circle cx="10" cy="7" r="2.6" />
      <path d="M5 21c0-5 2.2-8 5-8s5 3 5 8" />
      <path d="M18 3v18M18 3l3.5 2.5L18 8" fill="currentColor" />
    </>
  ),
  moBinh: (
    <>
      <path d="M3 9 8 5l5 4z" fill="currentColor" />
      <circle cx="8" cy="11.5" r="2" />
      <path d="M4.5 20c0-3 1.6-5 3.5-5s3.5 2 3.5 5" />
      <path d="M17 9v8M13 13h8" />
    </>
  ),
  dieuQuan: (
    <>
      <path d="M6 21V3" />
      <path d="M6 4h12l-3 4 3 4H6" fill="currentColor" />
    </>
  ),
  tanCong: (
    <>
      <path d="M4 20 18 6M20 20 6 6" />
      <path d="m18 6 1.5-3.5L16 4zM6 6 4.5 2.5 8 4z" fill="currentColor" />
    </>
  ),
  muuKe: (
    <>
      <rect x="4" y="6" width="16" height="12" rx="1.5" />
      <path d="M4 9h16M4 15h16" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" />
    </>
  ),
  keSach: (
    <>
      <rect x="3.5" y="6" width="10" height="14" rx="1" />
      <path d="M9 4.5h10.5V18" />
      <path d="M6.5 10h4M6.5 13h4" />
    </>
  ),
  tuyetKy: (
    <>
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
    </>
  ),
  ketThuc: (
    <>
      <rect x="5" y="13" width="14" height="7" rx="1" fill="currentColor" />
      <path d="M9 13V8a3 3 0 0 1 6 0v5" />
      <circle cx="12" cy="5" r="2" />
    </>
  ),
  song: <path d="M2 8c2.5-2 4.5-2 7 0s4.5 2 7 0 4-2 6 0M2 13c2.5-2 4.5-2 7 0s4.5 2 7 0 4-2 6 0M2 18c2.5-2 4.5-2 7 0s4.5 2 7 0 4-2 6 0" />,
  nui: (
    <>
      <path d="M2 20 9 6l4 7 2-3 7 10z" />
      <path d="M7.5 9 9 6l1.5 3" fill="currentColor" />
    </>
  ),
  rung: (
    <>
      <circle cx="9" cy="9" r="5" />
      <circle cx="16" cy="11" r="4" />
      <path d="M9 14v7M16 15v6M5 21h14" />
    </>
  ),
  ruong: (
    <>
      <path d="M3 6h18v14H3z" />
      <path d="M3 13h18M10 6v14M17 6v14" />
    </>
  ),
  lang: (
    <>
      <path d="M2 11c4-1 7-4 10-7 3 3 6 6 10 7" />
      <path d="M5 10.5V20h14v-9.5" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  sach: (
    <>
      <path d="M4 5c3-1 5.5-1 8 1 2.5-2 5-2 8-1v14c-3-1-5.5-1-8 1-2.5-2-5-2-8-1z" />
      <path d="M12 6v14" />
    </>
  ),
  hoi: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7v.5" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </>
  ),
  roi: (
    <>
      <path d="M14 4H5v16h9" />
      <path d="M10 12h11M17 8l4 4-4 4" />
    </>
  ),
  chienTruong: (
    <>
      <path d="M2 16c2.5-2 4.5-2 7 0s4.5 2 7 0 4-2 6 0" />
      <path d="M4 12 9 4l3 5 2-2 6 5" />
    </>
  ),
  mo: <path d="m6 9 6 6 6-6" />,
  dong: <path d="M6 6l12 12M18 6 6 18" />,
  chienCong: (
    <>
      <path d="M8 3h8v6a4 4 0 0 1-8 0z" fill="currentColor" />
      <path d="M8 5H5a3 3 0 0 0 3 4M16 5h3a3 3 0 0 1-3 4M12 13v4M8 21h8M10 17h4v4h-4z" />
    </>
  ),
};

export function Icon({ name, size = 20, className = '', style, title }: { name: IconName; size?: number; className?: string; style?: CSSProperties; title?: string }) {
  return (
    <svg
      className={`ic ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {P[name]}
    </svg>
  );
}
