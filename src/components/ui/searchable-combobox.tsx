'use client';

import { useState } from 'react';
import { Check, ChevronDown, PencilLine } from 'lucide-react';
import {
    Command,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';

export interface ComboboxOption {
    value: string;
    label: string;
    keywords?: string;
    featured?: boolean;
    description?: string;
}

interface SearchableComboboxProps {
    options: ComboboxOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    searchPlaceholder: string;
    noResultsText: string;
    disabled?: boolean;
    emptyText?: string;
}

export function SearchableCombobox({
    options,
    value,
    onChange,
    placeholder,
    searchPlaceholder,
    noResultsText,
    disabled = false,
    emptyText,
}: SearchableComboboxProps) {
    const [open, setOpen] = useState(false);
    const selected = options.find((option) => option.value === value);
    const featuredOptions = options.filter((option) => option.featured);
    const regularOptions = options.filter((option) => !option.featured);

    return (
        <div className="space-y-1.5">
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((current) => !current)}
                aria-expanded={open}
                className="flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <span className={selected ? 'truncate' : 'truncate text-muted-foreground'}>
                    {selected?.label || (disabled && emptyText ? emptyText : placeholder)}
                </span>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            </button>
            {open && !disabled && (
                <div className="rounded-lg border border-border bg-popover shadow-md">
                    <Command>
                        <CommandInput placeholder={searchPlaceholder} autoFocus />
                        {featuredOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setOpen(false);
                                }}
                                className="flex w-full items-center gap-2 border-b border-border bg-accent/40 px-3 py-2 text-start transition-colors hover:bg-accent"
                            >
                                <PencilLine className="size-4 shrink-0 text-primary" />
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-medium">
                                        {option.label}
                                    </span>
                                    {option.description && (
                                        <span className="block text-xs text-muted-foreground">
                                            {option.description}
                                        </span>
                                    )}
                                </span>
                                {option.value === value && (
                                    <Check className="size-4 shrink-0 text-primary" />
                                )}
                            </button>
                        ))}
                        <CommandList className="max-h-40">
                            <CommandEmpty>{noResultsText}</CommandEmpty>
                            {regularOptions.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={`${option.label} ${option.keywords || ''} ${option.value}`}
                                    data-checked={option.value === value}
                                    onSelect={() => {
                                        onChange(option.value);
                                        setOpen(false);
                                    }}
                                >
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandList>
                    </Command>
                </div>
            )}
        </div>
    );
}
