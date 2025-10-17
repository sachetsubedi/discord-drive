import { FC, useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Select, SelectContent, SelectTrigger } from '@/components/ui/select';

const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Mobi|Android/i.test(navigator.userAgent);
};

const SelectCommand: FC<{
  onChange?: (value: string) => void;
  options?: { label: string; value: string }[];
  value?: string;
  disabled?: boolean;
}> = ({ options = [], onChange, value, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || '');
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setSelectedValue(value || '');
  }, [value]);

  useEffect(() => {
    setMobile(isMobile());
  }, []);

  const handleSelect = (val: string) => {
    if (disabled) return;
    setSelectedValue(val);
    onChange?.(val);
    setOpen(false);
  };

  if (mobile) {
    // ✅ Mobile: use CommandDialog (prevents keyboard disappearing)
    return (
      <>
        <Button
          variant="outline"
          onClick={() => !disabled && setOpen(true)}
          disabled={disabled}
          className="w-full justify-between"
        >
          {options.find((opt) => opt.value === selectedValue)?.label || (
            <span className="text-muted-foreground">Select an option</span>
          )}
        </Button>

        <CommandDialog open={open} onOpenChange={setOpen}>
          <Command>
            <CommandInput placeholder="Search..." className="h-9" />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((item) => (
                  <CommandItem
                    key={item.value}
                    onSelect={() => handleSelect(item.value)}
                    className={`hover:bg-accent ${
                      selectedValue === item.value ? 'bg-accent' : ''
                    }`}
                  >
                    {item.label}
                    <Check
                      className={cn(
                        'ml-auto',
                        selectedValue === item.value
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </CommandDialog>
      </>
    );
  }

  // ✅ Desktop: regular Select + Command
  return (
    <Select open={open} onOpenChange={disabled ? undefined : setOpen}>
      <SelectTrigger disabled={disabled}>
        <div
          role="combobox"
          className="flex justify-between text-accent-foreground"
        >
          {options.find((option) => option.value === selectedValue)?.label || (
            <span className="text-muted-foreground">Select an option</span>
          )}
        </div>
      </SelectTrigger>
      <SelectContent className="p-0" position="popper" avoidCollisions={false}>
        <Command>
          <CommandInput placeholder="Search..." className="h-9" />
          <CommandList>
            <CommandEmpty>No items found.</CommandEmpty>
            <CommandGroup>
              {options.map((item) => (
                <CommandItem
                  key={item.value}
                  className={`hover:bg-accent ${
                    selectedValue === item.value ? 'bg-accent' : ''
                  }`}
                  onSelect={() => handleSelect(item.value)}
                >
                  {item.label}
                  <Check
                    className={cn(
                      'ml-auto',
                      selectedValue === item.value
                        ? 'opacity-100'
                        : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </SelectContent>
    </Select>
  );
};

export default SelectCommand;