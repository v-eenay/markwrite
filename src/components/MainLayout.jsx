import React from 'react';

const MainLayout = ({ children }) => {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>MarkWrite</h1>
        <p>Modern Markdown Editor</p>
      </header>
      <main>{children}</main>
    </div>
  );
};

export default MainLayout;