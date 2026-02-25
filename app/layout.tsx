import {Metadata} from "next";

export const metadata: Metadata = {
    title: 'Portfolio API',
    description: 'API for portfolio website',
  }
  
  export default function RootLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    )
  }
  