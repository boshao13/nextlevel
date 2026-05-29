// src/public/Signed.jsx — confirmation page after signing
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import styled from 'styled-components';
import { FiCheckCircle, FiDownload } from 'react-icons/fi';
import axios from 'axios';

const Page = styled.div`
  min-height: 100vh; background: #f5f8fc;
  display: flex; align-items: center; justify-content: center; padding: 24px;
`;

const Card = styled.div`
  background: white; padding: 40px; border-radius: 16px; max-width: 480px;
  box-shadow: 0 4px 24px rgba(0,0,0,.06); text-align: center;
`;

const DLBtn = styled.a`
  display: inline-flex; align-items: center; gap: 8px;
  background: #0f4c81; color: white; padding: 12px 22px; border-radius: 999px;
  font-weight: 700; text-decoration: none;
`;

const Signed = () => {
  const { token } = useParams();
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    axios.get(`/api/sign/${token}`).then(r => setMeta(r.data)).catch(() => {});
  }, [token]);

  return (
    <Page>
      <Helmet><meta name="referrer" content="no-referrer" /></Helmet>
      <Card>
        <FiCheckCircle size={56} color="#10b981" />
        <h1 style={{ margin: '14px 0 6px' }}>You're done!</h1>
        <p style={{ color: '#4a5568' }}>
          You signed <strong>{meta?.title || 'the document'}</strong>. A copy is at the link below.
        </p>
        <DLBtn href={`/api/sign/${token}/signed-file`} target="_blank" rel="noopener noreferrer">
          <FiDownload /> Download signed PDF
        </DLBtn>
      </Card>
    </Page>
  );
};

export default Signed;
