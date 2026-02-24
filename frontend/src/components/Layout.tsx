import React, { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = "3D Bin Packing Optimizer",
  showHeader = true 
}) => {
  return (
    <div className="layout">
      {showHeader && (
        <header className="app-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="app-title">
                <span className="title-icon">🚛</span>
                {title}
              </h1>
              <p className="app-subtitle">
                Advanced 3D Bin Packing Algorithm for Logistics Optimization
              </p>
            </div>
            <div className="header-right">
              <div className="header-info">
                <div className="info-item">
                  <span className="info-label">Backend:</span>
                  <span className="info-value">✅ Running</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Algorithm:</span>
                  <span className="info-value">✅ Active</span>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      <main className="app-main">
        <div className="main-content">
          {children}
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-left">
            <p>© 2024 3D Bin Packing Optimizer - Thesis Project</p>
          </div>
          <div className="footer-right">
            <div className="footer-links">
              <a href="/api/docs" target="_blank" rel="noopener noreferrer">
                📚 API Documentation
              </a>
              <a href="/api/v1/health" target="_blank" rel="noopener noreferrer">
                🏥 Health Check
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 