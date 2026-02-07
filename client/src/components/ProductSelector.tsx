import { useState, useEffect, useCallback, useRef } from "react";
import { Gamepad2, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Product {
  id: number;
  name: string;
  price: string | null;
  platform: string;
  category: string;
  availability: string;
}

interface ProductSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  dataTestId?: string;
}

const getPlatformBadge = (platform: string): string => {
  const platformMap: Record<string, string> = {
    ps5: "PS5",
    ps4: "PS4",
    xbox_series: "Xbox Series",
    xbox_one: "Xbox One",
    nintendo: "Nintendo",
    pc: "PC",
    all: "",
  };
  return platformMap[platform] || platform;
};

export function ProductSelector({
  value,
  onChange,
  placeholder = "Buscar juego o producto...",
  disabled = false,
  dataTestId = "product-selector",
}: ProductSelectorProps) {
  const [searchInput, setSearchInput] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (value !== searchInput) {
      setSearchInput(value || "");
    }
  }, [value]);

  const fetchProducts = useCallback(async (searchQuery: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const url = searchQuery.length >= 2
        ? `/api/products/browse?q=${encodeURIComponent(searchQuery)}&limit=20`
        : `/api/products/browse?limit=20`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Error fetching products");
      }
      const data = await response.json();
      setProducts(data.products || []);
      setIsOpen(true);
    } catch (err) {
      setError("No se encontraron productos");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search handler
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setSearchInput(inputValue);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (inputValue.length === 0) {
      setIsOpen(false);
      setProducts([]);
      return;
    }

    debounceTimeoutRef.current = setTimeout(() => {
      fetchProducts(inputValue);
    }, 300);
  }, [fetchProducts]);

  // Fetch popular products on mount or when opening empty search
  useEffect(() => {
    if (isOpen && searchInput.length === 0 && products.length === 0) {
      fetchProducts("");
    }
  }, [isOpen, searchInput, products.length, fetchProducts]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  }, []);

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    onChange(product.name);
    setSearchInput(product.name);
    setIsOpen(false);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (searchInput.length === 0) {
      fetchProducts("");
    } else {
      setIsOpen(true);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Gamepad2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 z-10" />
        <Input
          data-testid={dataTestId}
          type="text"
          value={searchInput}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10 pr-8 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-[#6200EA] focus-visible:border-[#6200EA]"
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 animate-spin" />
        )}
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-[#2a2a2a] border border-white/10 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
          data-testid={`${dataTestId}-dropdown`}
        >
          {isLoading ? (
            <div className="p-3 text-center text-white/50 text-sm">
              Cargando...
            </div>
          ) : products.length === 0 ? (
            <div className="p-3 text-center text-white/50 text-sm">
              {error || "No se encontraron productos"}
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {products.map((product) => {
                const platformBadge = getPlatformBadge(product.platform);
                return (
                  <li
                    key={product.id}
                    data-testid={`product-item-${product.id}`}
                  >
                    <button
                      type="button"
                      onClick={() => handleProductSelect(product)}
                      className="w-full px-3 py-2 text-left hover:bg-[#6200EA]/20 transition-colors text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-white truncate">{product.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {product.price && (
                              <span className="text-xs text-white/60">
                                {product.price}
                              </span>
                            )}
                            {platformBadge && (
                              <span className="inline-block px-2 py-0.5 bg-[#6200EA]/30 text-white/80 text-xs rounded">
                                {platformBadge}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
