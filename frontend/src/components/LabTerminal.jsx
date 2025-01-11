import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { WebglAddon } from '@xterm/addon-webgl';
import '@xterm/xterm/css/xterm.css';
import useSSHStore from '../store/SSHStore';
import Session from '../utils/Session';

export const LabTerminal = ({ terminalId }) => {
  const divRef = useRef(null);
  const terminalRef = useRef(null);
  const { getSession, addSession } = useSSHStore();

  useEffect(() => {
    if (!divRef.current) return;
    // 获取或创建session
    let session = getSession(terminalId);
    if (!session) {
      session = new Session();
      addSession(terminalId, session);
    }

    // 初始化terminal
    terminalRef.current = new Terminal({
      unicode: true,
      cursorStyle: 'bar',
      cursorBlink: true,
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
      },
      fontFamily: '"Cascadia Code", Menlo, "Microsoft YaHei", monospace',
      fontSize: 14,
      scrollback: 1000,
      convertEol: true,
      term: 'xterm-256color',
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    const webglAddon = new WebglAddon();

    terminalRef.current.loadAddon(fitAddon);
    terminalRef.current.loadAddon(webLinksAddon);
    terminalRef.current.loadAddon(webglAddon);

    terminalRef.current.open(divRef.current);
    fitAddon.fit();
    terminalRef.current.focus();

    // 处理session连接
    if (session.isConnected()) {
      console.log('session connected, update terminalref');
      // 已有session，更新terminal
      session.updateTerminal(terminalRef.current);
    } else {
      // 新session，建立连接
      console.log('session not connected, try connect');
      session.connect(terminalRef.current);
    }

    // 处理用户输入
    terminalRef.current.onData((data) => {
      session.send(data);
    });

    // 处理resize
    const handleResize = () => {
      fitAddon.fit();
      const { cols, rows } = terminalRef.current;
      session?.send(
        JSON.stringify({
          action: 'resize',
          cols,
          rows,
        }),
      );
    };

    setTimeout(() => {
      handleResize();
    }, 1000);

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(divRef.current);

    return () => {
      // 清理
      resizeObserver.disconnect();
      terminalRef.current.dispose();
      terminalRef.current.dispose();
    };
    //   if (session) {
    //     session.destroy();
    //   }
  }, [terminalId]);

  return (
    <div className="w-full h-full">
      <div ref={divRef} className="w-full h-full bg-gray-500"></div>
    </div>
  );
};
