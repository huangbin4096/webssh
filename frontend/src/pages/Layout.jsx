// src/layouts/DefaultLayout.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const DefaultLayout = ({ children }) => {
  return (
    <div className="default-layout">
      <header>
        {/* 头部内容 */}
        <div>
          <div className="flex gap-4">
            <div>
              <Link to="/">Home</Link>
            </div>
            <div>
              <Link to="/term/1">term1</Link>
            </div>
            <div>
              <Link to="/term/2">term2</Link>
            </div>
            <div>
              <Link to="/NoTermPage">NoTermPage</Link>
            </div>
          </div>
          {/* <LabTerminal sessionId={1} /> */}
        </div>
      </header>
      <main>
        {children} {/* 页面内容将插入到这里 */}
      </main>
      <footer>
        {/* 底部内容 */}
        <h1>Footer</h1>
      </footer>
    </div>
  );
};

export default DefaultLayout;
