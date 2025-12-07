'use client';

import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Place {
  displayName: string;
  lat: number;
  lng: number;
}

interface RouteInputProps {
  onRouteRequest: (params: {
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
    wage: number;
    hasGoodToGo: boolean;
  }) => void;
  isLoading?: boolean;
}

export default function RouteInput({ onRouteRequest, isLoading }: RouteInputProps) {
  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [originResults, setOriginResults] = useState<Place[]>([]);
  const [destResults, setDestResults] = useState<Place[]>([]);
  const [origin, setOrigin] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [wage, setWage] = useState(25);
  const [hasGoodToGo, setHasGoodToGo] = useState(true);
  const [originOpen, setOriginOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);

  const searchPlaces = useDebouncedCallback(async (query: string, setter: (places: Place[]) => void) => {
    if (query.length < 2) {
      setter([]);
      return;
    }

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setter(data.places || []);
    } catch (error) {
      console.error('Search error:', error);
      setter([]);
    }
  }, 300);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) return;

    onRouteRequest({
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat: destination.lat, lng: destination.lng },
      wage,
      hasGoodToGo
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Origin Input with Combobox */}
      <div className="grid w-full gap-1.5">
        <Label htmlFor="origin">From</Label>
        <Popover open={originOpen} onOpenChange={setOriginOpen}>
          <PopoverTrigger asChild>
            <Button
              id="origin"
              variant="outline"
              role="combobox"
              aria-expanded={originOpen}
              className="w-full justify-between font-normal"
            >
              {origin ? origin.displayName : "Enter starting location"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search locations..."
                value={originQuery}
                onValueChange={(value) => {
                  setOriginQuery(value);
                  searchPlaces(value, setOriginResults);
                }}
              />
              <CommandList>
                <CommandEmpty>No locations found.</CommandEmpty>
                <CommandGroup>
                  {originResults.map((place, i) => (
                    <CommandItem
                      key={i}
                      value={place.displayName}
                      onSelect={() => {
                        setOrigin(place);
                        setOriginQuery('');
                        setOriginResults([]);
                        setOriginOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          origin?.displayName === place.displayName ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {place.displayName}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Destination Input with Combobox */}
      <div className="grid w-full gap-1.5">
        <Label htmlFor="destination">To</Label>
        <Popover open={destOpen} onOpenChange={setDestOpen}>
          <PopoverTrigger asChild>
            <Button
              id="destination"
              variant="outline"
              role="combobox"
              aria-expanded={destOpen}
              className="w-full justify-between font-normal"
            >
              {destination ? destination.displayName : "Enter destination"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search locations..."
                value={destQuery}
                onValueChange={(value) => {
                  setDestQuery(value);
                  searchPlaces(value, setDestResults);
                }}
              />
              <CommandList>
                <CommandEmpty>No locations found.</CommandEmpty>
                <CommandGroup>
                  {destResults.map((place, i) => (
                    <CommandItem
                      key={i}
                      value={place.displayName}
                      onSelect={() => {
                        setDestination(place);
                        setDestQuery('');
                        setDestResults([]);
                        setDestOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          destination?.displayName === place.displayName ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {place.displayName}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Hourly Wage Slider */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="wage">Hourly Wage</Label>
          <span className="text-sm font-medium text-primary">${wage}/hr</span>
        </div>
        <Slider
          id="wage"
          min={15}
          max={200}
          step={5}
          value={[wage]}
          onValueChange={(value) => setWage(value[0])}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>$15/hr</span>
          <span>$200/hr</span>
        </div>
      </div>

      {/* Good To Go Toggle */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="goodToGo"
          checked={hasGoodToGo}
          onCheckedChange={(checked) => setHasGoodToGo(checked === true)}
        />
        <Label
          htmlFor="goodToGo"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          I have a Good To Go! pass
        </Label>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!origin || !destination || isLoading}
        className="w-full"
      >
        {isLoading ? 'Calculating...' : 'Find Best Route'}
      </Button>
    </form>
  );
}
