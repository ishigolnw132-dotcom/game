import type { Metadata } from 'next';
import './globals.css';
import '@fontsource/noto-sans-thai/400.css';
import '@fontsource/noto-sans-thai/500.css';
import '@fontsource/noto-sans-thai/600.css';
import '@fontsource/noto-sans-thai/700.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
export const metadata: Metadata = {title:'CODE QUEST 3D · โลกของนักคิดตัวน้อย',description:'ออกผจญภัยและเขียนโปรแกรมด้วย Blockly สำหรับชั้น ป.4',manifest:'/manifest.json',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="th"><body>{children}</body></html>}
