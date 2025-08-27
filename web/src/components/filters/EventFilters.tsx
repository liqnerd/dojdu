"use client";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function EventFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const city = searchParams.get('city') || '';
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';

  const update = (patch: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
      <div>
        <Label htmlFor="q">Search</Label>
        <Input id="q" placeholder="Title or description" defaultValue={q} onChange={(e) => update({ q: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <Input id="category" placeholder="slug e.g. music" defaultValue={category} onChange={(e) => update({ category: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="city">City</Label>
        <Input id="city" placeholder="e.g. Prague" defaultValue={city} onChange={(e) => update({ city: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="from">From</Label>
        <Input id="from" type="date" defaultValue={from} onChange={(e) => update({ from: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="to">To</Label>
        <Input id="to" type="date" defaultValue={to} onChange={(e) => update({ to: e.target.value })} />
      </div>
      <div className="md:col-span-5 flex gap-2">
        <Button variant="outline" onClick={() => router.push(pathname)}>Reset</Button>
      </div>
    </div>
  );
}

