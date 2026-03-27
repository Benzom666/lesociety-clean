import React from "react";
import { useRouter } from "next/router";
import withAuth from "@/core/withAuth";

function PaymentCancel() {
  const router = useRouter();

  const handleRetry = () => {
    router.push('/membership');
  };

  const handleGoBack = () => {
    router.push('/messages');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.iconCancel}>✕</div>
        <h1 style={styles.title}>Payment Cancelled</h1>
        
        <p style={styles.text}>
          Your payment was cancelled. No charges have been made to your account.
        </p>

        <div style={styles.buttonGroup}>
          <button style={styles.buttonPrimary} onClick={handleRetry}>
            Try Again
          </button>
          <button style={styles.buttonSecondary} onClick={handleGoBack}>
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#000',
    padding: '20px',
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: '20px',
    padding: '40px',
    textAlign: 'center',
    maxWidth: '500px',
    width: '100%',
    border: '1px solid #333',
  },
  iconCancel: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#ef4444',
    color: '#fff',
    fontSize: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 30px',
    fontWeight: 'bold',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '20px',
  },
  text: {
    fontSize: '16px',
    color: '#999',
    marginBottom: '30px',
    lineHeight: '1.6',
  },
  buttonGroup: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  buttonPrimary: {
    backgroundColor: '#fff',
    color: '#000',
    border: 'none',
    borderRadius: '30px',
    padding: '15px 40px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    color: '#fff',
    border: '2px solid #fff',
    borderRadius: '30px',
    padding: '15px 40px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
};

export default withAuth(PaymentCancel);
