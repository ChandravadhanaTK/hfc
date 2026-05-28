import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export type GroupOption = { id: string; name: string };

export function GroupMultiSelect({
  groups,
  selected,
  onChange,
  placeholder = "All Groups",
}: {
  groups: GroupOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  };

  const label = selected.length === 0
    ? placeholder
    : selected.length === 1
      ? groups.find(g => g.id === selected[0])?.name ?? placeholder
      : `${selected.length} groups`;

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="min-w-[200px] justify-between">
            {label}
            <ChevronsUpDown className="size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[260px] p-0">
          <Command>
            <CommandInput placeholder="Filter groups…" />
            <CommandList>
              <CommandEmpty>No group found.</CommandEmpty>
              <CommandGroup>
                {groups.map(g => (
                  <CommandItem key={g.id} value={g.name} onSelect={() => toggle(g.id)}>
                    <Check className={cn("size-4 mr-2", selected.includes(g.id) ? "opacity-100" : "opacity-0")} />
                    {g.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected.length > 0 && (
        <Button variant="ghost" size="sm" onClick={() => onChange([])}>
          <X className="size-3" /> Clear
        </Button>
      )}
    </div>
  );
}
