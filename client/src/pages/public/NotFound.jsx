import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';

export default function NotFound() {
  return (
    <div className="container text-center" style={{ padding: 'var(--space-9) 0' }}>
      <span className="eyebrow">404</span>
      <h2>This route isn&rsquo;t on the map</h2>
      <p style={{ maxWidth: 420, margin: '0 auto var(--space-6)' }}>
        The page you&rsquo;re looking for doesn&rsquo;t exist, or may have moved.
      </p>
      <Link to="/">
        <Button variant="primary">Back to home</Button>
      </Link>
    </div>
  );
}
