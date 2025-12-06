import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  type FC,
  type ReactNode,
} from 'react';

type DropdownContextType = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggle: () => void;
};

const DropdownContext = createContext<DropdownContextType | null>(null);

const useDropdown = () => {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error('useDropdown must be used within a DropdownProvider');
  }
  return context;
};

const Dropdown: FC<{ children: ReactNode }> & {
  Trigger: FC<{ children: ReactNode; asChild?: boolean }>;
  Content: FC<{ children: ReactNode }>;
} = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const toggle = () => setIsOpen((prev) => !prev);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen, toggle }}>
      <div ref={dropdownRef} className="relative">
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

const Trigger: FC<{ children: ReactNode; asChild?: boolean }> = ({
  children,
  asChild,
}) => {
  const { toggle } = useDropdown();
  if (asChild) {
    return <div onClick={toggle}>{children}</div>;
  }
  return (
    <button type="button" onClick={toggle} className="icon-button">
      {children}
    </button>
  );
};

const Content: FC<{ children: ReactNode }> = ({ children }) => {
  const { isOpen } = useDropdown();
  return (
    <>
      {isOpen && (
        <div className="absolute right-0 z-30 mt-2 w-56 rounded-xl menu-surface p-2 text-sm">
          {children}
        </div>
      )}
    </>
  );
};

Dropdown.Trigger = Trigger;
Dropdown.Content = Content;

export default Dropdown;
