import React from 'react';
import { ThemeProvider } from './components/ThemeProvider';
import { ToasterProvider, Toaster } from './components/Toaster';
import { ChatInterface } from './components/ChatInterface';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './components/ThemeProvider';

function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">R</span>
          </div>
          <h1 className="text-xl font-bold">Reggy Agent</h1>
          <span className="text-sm text-muted-foreground">Financial Aid Assistant</span>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </header>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" enableSystem={false}>
      <ToasterProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Header />
          <main className="container mx-auto px-4 py-8 h-[calc(100vh-80px)]">
            <ChatInterface />
          </main>
          <Toaster position="top-right" />
        </div>
      </ToasterProvider>
    </ThemeProvider>
  );
}

export default App; 