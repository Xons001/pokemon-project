import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Equipos | Pokemon Project',
  description: 'Gestiona equipos y analiza combates de Pokemon Champions.',
}

export default function PokedexPage() {
  redirect('/equipos')
}
