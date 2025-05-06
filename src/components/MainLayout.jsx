import React from 'react';

const MainLayout = ({ children }) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-container">
          <h1 className="app-title">Mark<span className="title-accent">Write</span></h1>
          <div className="glitch-effect"></div>
        </div>
        <p className="app-subtitle">Cyberpunk Markdown Editor</p>
      </header>

      <main className="app-main">{children}</main>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-info">
            <p>© {currentYear} <span className="footer-name">Vinay Koirala</span></p>
            <p className="footer-tagline">Crafted with code in the digital wasteland</p>
          </div>
          <div className="footer-links">
            <a href="https://github.com/v-eenay" target="_blank" rel="noopener noreferrer" className="github-link">
              <span className="github-icon">&#xe007;</span> v-eenay
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;