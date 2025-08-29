import React, { useEffect } from 'react';
import Head from 'next/head';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

declare global {
  interface Window {
    __PUBLIC_PATH__?: string;
  }
}

const HoseBuilder = () => {
  useEffect(() => {
    window.__PUBLIC_PATH__ = publicRuntimeConfig.staticFolder || '/hosebuilder/static/';
    
    const scripts = [
      '/hosebuilder/static/js/453.0c2a2d38.js',
      '/hosebuilder/static/js/main.2fc0badd.js'
    ];

    const loadScriptSequentially = async (scripts: string[]) => {
      for (const src of scripts) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.defer = true;
          script.onload = () => {
            console.log(`Script loaded: ${src}`);
            resolve();
          };
          script.onerror = (e) => {
            console.error('Script loading error:', src, e);
            reject(e);
          };
          document.body.appendChild(script);
        });
      }
    };

    loadScriptSequentially(scripts).catch(console.error);

    return () => {
      document.querySelectorAll('script[src^="/hosebuilder/"]').forEach(script => {
        script.remove();
      });
    };
  }, []);

  return (
    <>
      <Head>
        <title>Hose Builder - Fluid Power Group</title>
        <meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1.00001,viewport-fit=cover" />
        
        <style>{`
          /* Remove conflicting styles */
          .hosebuilder-container {
            height: calc(100vh - 120px); /* Header height + fade clearance */
            width: 100%;
            position: relative;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            margin-top: 30px; /* Push content below header fade */
          }

          #root {
            display: flex;
            height: 100%;
            position: relative;
          }

          /* Scrollbar styles */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #555;
          }

          /* Support for touch devices */
          @supports (-webkit-overflow-scrolling: touch) {
            .scrollable-content {
              -webkit-overflow-scrolling: touch;
              overflow-y: auto;
            }
          }

          .scroll-view {
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            flex: 1;
          }

          .react-native-safe-area-view {
            flex: 1 1 auto;
          }

          img {
            max-width: 100%;
            height: auto;
          }

          /* Add styles for the Next button container */
          .next-button-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
          }
        `}</style>
        <link rel="icon" type="image/png" sizes="16x16" href="/hosebuilder/favicon-16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/hosebuilder/favicon-32.png" />
        <link rel="manifest" href="/hosebuilder/manifest.json" />
      </Head>
      <div className="hosebuilder-container">
        <div id="root"></div>
      </div>
    </>
  );
};

export default HoseBuilder;