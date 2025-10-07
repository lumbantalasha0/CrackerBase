import Script from 'next/script';
import Head from 'next/head'
import React from 'react'

export default function Index() {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>BEMACHO Crackers Manager</title>
        <meta name="description" content="Professional crackers business management system for inventory, sales, expenses, and analytics" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
      </Head>

      <div id="root"></div>
        <Script
          src="/src/main.tsx"
          strategy="afterInteractive"
          type="module"
        />
    </>
  )
}
