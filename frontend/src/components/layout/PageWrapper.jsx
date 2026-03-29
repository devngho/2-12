import Navbar from './Navbar';
import FloatingMenu from './FloatingMenu';

export default function PageWrapper({ children }) {
  return (
    <div className="min-h-screen bg-base-100 text-base-content flex flex-col items-center">
      <div className="w-full md:w-[85%] max-w-none flex flex-col min-h-screen relative">
        <Navbar />
        <main className="flex-grow p-4 md:p-6 flex flex-col">
          {children}
        </main>
      </div>
      <FloatingMenu />
    </div>
  );
}
