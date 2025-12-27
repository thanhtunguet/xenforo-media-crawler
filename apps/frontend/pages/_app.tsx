import { AppProps } from 'next/app';
import Head from 'next/head';
import './styles.css';
import { ToastProvider } from '@/contexts/ToastContext';
import { ToastContainer } from '@/components/ui/toast-container';

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>XenForo Media Crawler</title>
      </Head>
      <ToastProvider>
        <main className="app">
          <Component {...pageProps} />
        </main>
        <ToastContainer />
      </ToastProvider>
    </>
  );
}

export default CustomApp;
