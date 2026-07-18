#!/usr/bin/env pwsh

Write-Host "Création du projet..." -ForegroundColor Green
npx create-next-app@latest onps-website --no-typescript --no-eslint --no-src-dir --tailwind --app --import-alias "@/*"
cd onps-website

Write-Host "Installation des dépendances..." -ForegroundColor Green
npm install @libsql/client

# Créer lib/database.js
Write-Host "Création de lib/database.js..." -ForegroundColor Green
@"
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

export async function getSiteContent(key) {
  const result = await client.execute({
    sql: 'SELECT value FROM site_content WHERE key = ?',
    args: [key]
  });
  return result.rows[0]?.value || '';
}

export async function updateSiteContent(key, value) {
  await client.execute({
    sql: 'UPDATE site_content SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
    args: [value, key]
  });
}

export async function addProfessional(data) {
  await client.execute({
    sql: 'INSERT INTO professionals (name, profession, email, phone) VALUES (?, ?, ?, ?)',
    args: [data.name, data.profession, data.email, data.phone]
  });
}

export async function getProfessionals() {
  const result = await client.execute({
    sql: 'SELECT * FROM professionals WHERE registered = TRUE'
  });
  return result.rows;
}

export async function addNews(data) {
  await client.execute({
    sql: 'INSERT INTO news (title, content, date, category) VALUES (?, ?, ?, ?)',
    args: [data.title, data.content, data.date, data.category]
  });
}

export async function getNews() {
  const result = await client.execute({
    sql: 'SELECT * FROM news ORDER BY date DESC'
  });
  return result.rows;
}

export async function deleteNews(id) {
  await client.execute({
    sql: 'DELETE FROM news WHERE id = ?',
    args: [id]
  });
}

export async function getAllSiteContent() {
  const result = await client.execute({
    sql: 'SELECT * FROM site_content'
  });
  return result.rows;
}
"@ | Out-File -FilePath "lib/database.js" -Encoding UTF8

# Créer app/layout.js
Write-Host "Création de app/layout.js..." -ForegroundColor Green
@"
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'ONPS Mauritanie — Ordre National des Professions de Santé',
  description: 'Site officiel de l'Ordre National des Professions de Santé de Mauritanie'
}

export default function RootLayout({ children }) {
  return (
    <html lang='fr'>
      <body className='bg-slate-50 text-slate-900 antialiased flex min-h-screen flex-col'>
        <Header />
        <main className='flex-1'>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
"@ | Out-File -FilePath "app/layout.js" -Encoding UTF8

# Créer app/globals.css
Write-Host "Création de app/globals.css..." -ForegroundColor Green
@"
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    font-family: system-ui, -apple-system, sans-serif;
  }
}
"@ | Out-File -FilePath "app/globals.css" -Encoding UTF8

# Créer les pages
Write-Host "Création des pages..." -ForegroundColor Green

# app/page.js (Accueil)
@"
'use client'
import { useEffect, useState } from 'react'
import { getSiteContent, getNews, getProfessionals } from '@/lib/database'

export default function Home() {
  const [welcome, setWelcome] = useState('')
  const [news, setNews] = useState([])
  const [professionals, setProfessionals] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setWelcome(await getSiteContent('welcome_message'))
    const newsData = await getNews()
    setNews(newsData)
    const pros = await getProfessionals()
    setProfessionals(pros)
  }

  return (
    <div>
      <section className='relative overflow-hidden bg-emerald-950 py-24'>
        <div className='relative mx-auto max-w-7xl px-4'>
          <h1 className='text-4xl sm:text-5xl font-extrabold text-white leading-tight'>
            Ordre National des Professions de Santé
          </h1>
          <p className='mt-5 max-w-2xl text-lg text-emerald-100/90'>{welcome}</p>
          <div className='mt-8 flex flex-wrap gap-4'>
            <a href='/inscription' className='rounded-lg bg-amber-500 px-6 py-3 font-semibold text-emerald-950'>
              S'inscrire au tableau
            </a>
            <a href='/annuaire' className='rounded-lg border-2 border-white/70 px-6 py-3 font-semibold text-white'>
              Consulter l'annuaire
            </a>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-5xl px-4 -mt-10'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200'>
          <div className='text-center'>
            <p className='text-3xl font-extrabold text-emerald-800'>{professionals.length}</p>
            <p className='text-sm text-slate-500 mt-1'>Professionnels inscrits</p>
          </div>
          <div className='text-center'>
            <p className='text-3xl font-extrabold text-emerald-800'>{news.length}</p>
            <p className='text-sm text-slate-500 mt-1'>Actualités</p>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-7xl px-4 py-20'>
        <h2 className='text-3xl font-bold text-emerald-900'>Dernières actualités</h2>
        <div className='mt-8 grid gap-6 md:grid-cols-3'>
          {news.slice(0, 3).map(item => (
            <div key={item.id} className='rounded-xl bg-white shadow-sm ring-1 ring-slate-200 p-6'>
              <h3 className='font-semibold'>{item.title}</h3>
              <p className='mt-2 text-sm text-slate-600'>{item.content}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
"@ | Out-File -FilePath "app/page.js" -Encoding UTF8

# app/a-propos/page.js
@"
'use client'
import { useEffect, useState } from 'react'
import { getAllSiteContent } from '@/lib/database'

export default function APropos() {
  const [sections, setSections] = useState({A:[],B:[],C:[]})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const all = await getAllSiteContent()
    const data = Object.fromEntries(all.map(c => [c.key, c.value]))
    const sectionA = data.section_A?.split(',') || []
    const sectionB = data.section_B?.split(',') || []
    const sectionC = data.section_C?.split(',') || []
    setSections({A: sectionA, B: sectionB, C: sectionC})
  }

  return (
    <div className='mx-auto max-w-7xl px-4 py-20'>
      <div className='text-center mb-12'>
        <h1 className='text-4xl font-bold text-emerald-900'>L'Ordre</h1>
      </div>

      <div className='grid md:grid-cols-2 gap-8 mb-12'>
        <div className='bg-white rounded-xl p-6 shadow-sm'>
          <h2 className='text-2xl font-bold text-emerald-800 mb-4'>Conditions d'adhésion</h2>
          <ul className='space-y-3 text-slate-700'>
            <li>• Appartenir à l'une des professions spécifiées (Sections A, B, C)</li>
            <li>• Être titulaire d'un diplôme reconnu</li>
            <li>• Déposer sa candidature via la plateforme</li>
            <li>• S'acquitter de la cotisation annuelle</li>
          </ul>
        </div>

        <div className='bg-white rounded-xl p-6 shadow-sm'>
          <h2 className='text-2xl font-bold text-emerald-800 mb-4'>Conditions d'ouverture de cabinet</h2>
          <ul className='space-y-3 text-slate-700'>
            <li>• Être membre du Corps</li>
            <li>• La demande transmise par le ministre de la Santé</li>
            <li>• Inscription sur la plateforme</li>
            <li>• Visite sur place par le Corps</li>
          </ul>
        </div>
      </div>

      <div className='grid md:grid-cols-3 gap-6'>
        <div className='bg-emerald-900 text-white rounded-xl p-6'>
          <h3 className='text-lg font-bold text-amber-300 mb-4'>Section (A)</h3>
          <ul className='space-y-2'>
            {sections.A.map((item, i) => (
              <li key={i} className='flex items-start gap-2'>
                <span className='h-2 w-2 rounded-full bg-amber-400 mt-2'></span>
                <span>{item.trim()}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className='bg-emerald-900 text-white rounded-xl p-6'>
          <h3 className='text-lg font-bold text-amber-300 mb-4'>Section (B)</h3>
          <ul className='space-y-2'>
            {sections.B.map((item, i) => (
              <li key={i} className='flex items-start gap-2'>
                <span className='h-2 w-2 rounded-full bg-amber-400 mt-2'></span>
                <span>{item.trim()}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className='bg-emerald-900 text-white rounded-xl p-6'>
          <h3 className='text-lg font-bold text-amber-300 mb-4'>Section (C)</h3>
          <ul className='space-y-2'>
            {sections.C.map((item, i) => (
              <li key={i} className='flex items-start gap-2'>
                <span className='h-2 w-2 rounded-full bg-amber-400 mt-2'></span>
                <span>{item.trim()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
"@ | Out-File -FilePath "app/a-propos/page.js" -Encoding UTF8

# app/annuaire/page.js
@"
'use client'
import { useEffect, useState } from 'react'
import { getProfessionals } from '@/lib/database'

export default function Annuaire() {
  const [professionals, setProfessionals] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadProfessionals()
  }, [])

  const loadProfessionals = async () => {
    const data = await getProfessionals()
    setProfessionals(data)
  }

  const filtered = professionals.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.profession?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className='mx-auto max-w-7xl px-4 py-20'>
      <div className='text-center mb-8'>
        <h1 className='text-4xl font-bold text-emerald-900'>Annuaire</h1>
        <p className='mt-2 text-slate-600'>Trouver un professionnel de santé en Mauritanie</p>
      </div>

      <div className='max-w-md mx-auto mb-8'>
        <input
          type='text'
          placeholder='Rechercher par nom ou profession...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
        />
      </div>

      <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {filtered.map((pro, index) => (
          <div key={pro.id || index} className='bg-white rounded-xl p-6 shadow-sm ring-1 ring-slate-200'>
            <div className='flex items-center gap-4'>
              <div className='h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-xl'>
                {pro.name?.charAt(0) || '?'}
              </div>
              <div>
                <h3 className='font-bold text-slate-900'>{pro.name}</h3>
                <p className='text-sm text-emerald-700'>{pro.profession}</p>
              </div>
            </div>
            <div className='mt-4 space-y-2 text-sm text-slate-600'>
              {pro.email && <p>📧 {pro.email}</p>}
              {pro.phone && <p>📞 {pro.phone}</p>}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className='text-center py-12'>
          <p className='text-slate-500'>Aucun professionnel trouvé</p>
        </div>
      )}
    </div>
  )
}
"@ | Out-File -FilePath "app/annuaire/page.js" -Encoding UTF8

# app/actualites/page.js
@"
'use client'
import { useEffect, useState } from 'react'
import { getNews } from '@/lib/database'

export default function Actualites() {
  const [news, setNews] = useState([])
  const [category, setCategory] = useState('all')

  useEffect(() => {
    loadNews()
  }, [])

  const loadNews = async () => {
    const data = await getNews()
    setNews(data)
  }

  const filtered = category === 'all' ? news : news.filter(n => n.category === category)

  return (
    <div className='mx-auto max-w-7xl px-4 py-20'>
      <div className='text-center mb-8'>
        <h1 className='text-4xl font-bold text-emerald-900'>Actualités</h1>
        <p className='mt-2 text-slate-600'>Communiqués, annonces et événements de l'Ordre</p>
      </div>

      <div className='flex gap-2 mb-8 justify-center'>
        <button
          onClick={() => setCategory('all')}
          className={'px-4 py-2 rounded-lg ' + (category === 'all' ? 'bg-emerald-700 text-white' : 'bg-white text-slate-700')}
        >
          Toutes
        </button>
        <button
          onClick={() => setCategory('Actualite')}
          className={'px-4 py-2 rounded-lg ' + (category === 'Actualite' ? 'bg-emerald-700 text-white' : 'bg-white text-slate-700')}
        >
          Actualités
        </button>
        <button
          onClick={() => setCategory('Communique')}
          className={'px-4 py-2 rounded-lg ' + (category === 'Communique' ? 'bg-emerald-700 text-white' : 'bg-white text-slate-700')}
        >
          Communiqués
        </button>
      </div>

      <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {filtered.map(item => (
          <div key={item.id} className='bg-white rounded-xl shadow-sm ring-1 ring-slate-200 overflow-hidden'>
            <div className='h-2 bg-gradient-to-r from-emerald-600 to-amber-500'></div>
            <div className='p-6'>
              <div className='flex items-center gap-2 text-xs mb-3'>
                <span className='rounded-full bg-emerald-100 px-2.5 py-0.5 font-semibold text-emerald-800'>
                  {item.category}
                </span>
                <span className='text-slate-400'>{item.date}</span>
              </div>
              <h3 className='font-semibold text-slate-900'>{item.title}</h3>
              <p className='mt-2 text-sm text-slate-600 line-clamp-3'>{item.content}</p>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className='text-center py-12'>
          <p className='text-slate-500'>Aucune actualité disponible</p>
        </div>
      )}
    </div>
  )
}
"@ | Out-File -FilePath "app/actualites/page.js" -Encoding UTF8

# app/inscription/page.js
@"
'use client'
import { useState } from 'react'
import { addProfessional } from '@/lib/database'

export default function Inscription() {
  const [form, setForm] = useState({
    name: '',
    profession: '',
    email: '',
    phone: '',
    diploma: '',
    section: ''
  })
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await addProfessional(form)
      setMessage('✅ Candidature envoyée avec succès !')
      setForm({ name: '', profession: '', email: '', phone: '', diploma: '', section: '' })
    } catch (error) {
      setMessage('❌ Erreur lors de l\'envoi')
    }
  }

  return (
    <div className='mx-auto max-w-3xl px-4 py-20'>
      <div className='text-center mb-8'>
        <h1 className='text-4xl font-bold text-emerald-900'>Inscription</h1>
        <p className='mt-2 text-slate-600'>Déposez votre demande d'inscription au tableau de l'Ordre</p>
      </div>

      {message && (
        <div className='mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800'>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className='bg-white rounded-xl p-8 shadow-sm space-y-6'>
        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Nom complet *</label>
          <input
            type='text'
            required
            value={form.name}
            onChange={(e) => setForm({...form, name: e.target.value})}
            className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Profession *</label>
          <select
            required
            value={form.profession}
            onChange={(e) => setForm({...form, profession: e.target.value})}
            className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500'
          >
            <option value=''>Sélectionnez</option>
            <option value='Professeur technique'>Professeur technique</option>
            <option value='Infirmier'>Infirmier</option>
            <option value='Sage-femme'>Sage-femme</option>
            <option value='Technicien supérieur'>Technicien supérieur</option>
            <option value='Ingénieur biomédical'>Ingénieur biomédical</option>
            <option value='Biologiste médical'>Biologiste médical</option>
          </select>
        </div>

        <div className='grid md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-1'>Email *</label>
            <input
              type='email'
              required
              value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})}
              className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-slate-700 mb-1'>Téléphone *</label>
            <input
              type='tel'
              required
              value={form.phone}
              onChange={(e) => setForm({...form, phone: e.target.value})}
              className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500'
            />
          </div>
        </div>

        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Diplôme *</label>
          <input
            type='text'
            required
            value={form.diploma}
            onChange={(e) => setForm({...form, diploma: e.target.value})}
            className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Section *</label>
          <select
            required
            value={form.section}
            onChange={(e) => setForm({...form, section: e.target.value})}
            className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500'
          >
            <option value=''>Sélectionnez</option>
            <option value='A'>Section (A)</option>
            <option value='B'>Section (B)</option>
            <option value='C'>Section (C)</option>
          </select>
        </div>

        <button
          type='submit'
          className='w-full bg-emerald-700 text-white py-3 rounded-lg font-semibold hover:bg-emerald-600'
        >
          Envoyer la candidature
        </button>
      </form>
    </div>
  )
}
"@ | Out-File -FilePath "app/inscription/page.js" -Encoding UTF8

# app/contact/page.js
@"
'use client'
import { useState } from 'react'
import { getSiteContent } from '@/lib/database'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [siteName, setSiteName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    setSiteName(await getSiteContent('site_name_fr'))
    setPhone(await getSiteContent('phone'))
    setEmail(await getSiteContent('email'))
    setAddress(await getSiteContent('address'))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setMessage('✅ Message envoyé avec succès !')
    setForm({ name: '', email: '', message: '' })
  }

  return (
    <div className='mx-auto max-w-7xl px-4 py-20'>
      <div className='text-center mb-12'>
        <h1 className='text-4xl font-bold text-emerald-900'>Contact</h1>
        <p className='mt-2 text-slate-600'>Nous contacter pour toute question</p>
      </div>

      <div className='grid md:grid-cols-2 gap-8'>
        <div className='bg-white rounded-xl p-8 shadow-sm'>
          <h2 className='text-2xl font-bold text-emerald-800 mb-6'>Envoyez-nous un message</h2>
          
          {message && (
            <div className='mb-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800'>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-slate-700 mb-1'>Nom *</label>
              <input
                type='text'
                required
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-slate-700 mb-1'>Email *</label>
              <input
                type='email'
                required
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-slate-700 mb-1'>Message *</label>
              <textarea
                required
                rows='5'
                value={form.message}
                onChange={(e) => setForm({...form, message: e.target.value})}
                className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500'
              />
            </div>

            <button
              type='submit'
              className='w-full bg-emerald-700 text-white py-3 rounded-lg font-semibold hover:bg-emerald-600'
            >
              Envoyer
            </button>
          </form>
        </div>

        <div className='bg-emerald-900 text-white rounded-xl p-8'>
          <h2 className='text-2xl font-bold text-amber-300 mb-6'>{siteName}</h2>
          
          <div className='space-y-6'>
            <div>
              <h3 className='font-semibold text-amber-300 mb-2'>Adresse</h3>
              <p className='text-emerald-100'>📍 {address}</p>
            </div>

            <div>
              <h3 className='font-semibold text-amber-300 mb-2'>Téléphone</h3>
              <p className='text-emerald-100' dir='ltr'>📞 {phone}</p>
            </div>

            <div>
              <h3 className='font-semibold text-amber-300 mb-2'>Email</h3>
              <p className='text-emerald-100'>✉ {email}</p>
            </div>

            <div>
              <h3 className='font-semibold text-amber-300 mb-2'>Horaires</h3>
              <p className='text-emerald-100'>🕐 Lundi – Jeudi : 8h00 – 17h00</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
"@ | Out-File -FilePath "app/contact/page.js" -Encoding UTF8

# Créer components
Write-Host "Création des composants..." -ForegroundColor Green

# Header.js (CORRIGÉ)
@"
'use client'
import { useState, useEffect } from 'react'
import { getSiteContent } from '@/lib/database'
import AdminPanel from './AdminPanel'

export default function Header() {
  const [clicks, setClicks] = useState(0)
  const [admin, setAdmin] = useState(false)
  const [siteName, setSiteName] = useState('')
  const [tagline, setTagline] = useState('')
  useState('')

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    setSiteName(await getSiteContent('site_name_fr'))
    setTagline(await getSiteContent('tagline_fr'))
    setPhone(await getSiteContent('phone'))
    setEmail(await getSiteContent('email'))
  }

  const handleClick = () => {
    const newClicks = clicks + 1
    setClicks(newClicks)
    if (newClicks >= 5) {
      setAdmin(true)
      setClicks(0)
    }
    setTimeout(() => setClicks(0), 2000)
  }

  if (admin) {
    return <AdminPanel onClose={() => setAdmin(false)} />
  }

  return (
    <header className='sticky top-0 z-50 bg-white shadow-sm'>
      <div className='bg-emerald-900 text-emerald-50 text-xs'>
        <div className='mx-auto max-w-7xl px-4 py-1.5 flex items-center justify-between gap-2'>
          <span>{siteName}</span>
          <span className='hidden sm:inline' dir='ltr'>
            📞 {phone} • ✉ {email}
          </span>
        </div>
      </div>
      <div className='mx-auto max-w-7xl px-4'>
        <div className='flex items-center justify-between py-3 gap-2'>
          <div className='flex items-center gap-3'>
            <button onClick={handleClick} aria-label='Logo'>
              <div className='flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-700 to-emerald-900 text-2xl shadow-md'>
                🏥
              </div>
            </button>
            <a href=''
import { useEffect, useState } from 'react'
import { getSiteContent } from '@/lib/database'

export default function Footer() {
  const [siteName, setSiteName] = useState('')
  const [tagline, setTagline] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    setSiteName(await getSiteContent('site_name_fr'))
    setTagline(await getSiteContent('tagline_fr'))
    setAddress(await getSiteContent('address'))
    setPhone(await getSiteContent('phone'))
    setEmail(await getSiteContent('email'))
  }

  return (
    <footer className='bg-emerald-950 text-emerald-100'>
      <div className='mx-auto max-w-7xl px-4 py-12 grid gap-10 md:grid-cols-4'>
        <div className='md:col-span-2'>
          <h3 className='font-semibold text-white mb-3'>{siteName}</h3>
          <p className='text-sm text-emerald-200/80 mb-4'>{tagline}</p>
          <p className='text-sm text-emerald-200/80'>Ordre National des Professions de Santé</p>
        </div>
        <div>
          <h3 className='font-semibold text-white mb-3'>Liens rapides</h3>
          <ul className='space-y-2 text-sm'>
            <li><a href='/a-propos' className='hover:text-amber-400'>Présentation</a></li>
            <li><a href='/annuaire' className='hover:text-amber Contenu
          </button>
          <button onClick={() => setActiveTab('news')} className='px-4 py-2'>
            Actualités
          </button>
          <button onClick={() => setActiveTab('professionals')} className='px-4 py-2'>
            Professionnels
          </button>
        </div>

        {activeTab === 'content' && (
          <div className='space-y-4'>
            {Object.entries(content).map(([key, value]) => (
              <div key={key}>
                <label className='block text-sm font-medium text-slate-700 mb-1'>{key}</label>
                <textarea
                  value={value}
                  onChange={(e) => handleUpdate(key, e.target.value)}
                  className='w-full border rounded p-2 text-sm'
                  rows='3'
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'news' && (
          <div>
            <h3 className='font-semibold mb-4'>Ajouter une actualité</h3>
            <form onSubmit={handleAddNews} className='space-y-3 mb-6'>
              <input
                type='text'
                placeholder='Titre'
                value={newNews.title}
                onChange={(e) => setNewNews({...newNews, title: e.target.value})}
                className='w-full border rounded p-2'
              />
              <textarea
                placeholder='Contenu'
                value={newNews.content}
                onChange={(e) => setNewNews({...newNews, content: e.target.value})}
                className='w-full border rounded p-2'
                rows='3'
              />
              <div className='grid grid-cols-2 gap-2'>
                <input
                  type='date'
                  value={newNews.date}
                  onChange}</h4>
                  <p className='text-sm text-slate-600'>{item.content}</p>
                  <p className='text-xs text-slate-400'>{item.date} • {item.category}</p>
                </div>
                <button
                  onClick={() => handleDeleteNews(item.id)}
                  className='text-red-500 hover:text-red-700'
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'professionals' && (
          <div>
            <h3 className='font-semibold mb-2'>Professionnels inscrits</h3>
            {professionals.length === 0 && <p className='text-slate-500'>Aucun professionnel</p>}
            {professionals.map(pro => (
              <div key={pro.id} className='border p-3 mb-2'>
                <h4 className='font-medium'>{pro.name}</h4>
                <p className='text-sm text-slate-600'>{pro.profession}</p>
                <p className='text-sm text-slate-600'>{pro.email}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
"@ | Out-File -FilePath "components/AdminPanel.js" -Encoding UTF8

# Créer .env.local
Write-Host "Création de .env.local..." -ForegroundColor Green
@"
TURSO_DATABASE_URL=https://your-turso-url.turso.io
TURSO_AUTH_TOKEN=your-turso-token
"@ | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host "✅ Tous les fichiers créés avec succès !" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines étapes :" -ForegroundColor Yellow
Write-Host "1. Configurez .env.local avec vos données Turso"
Write-Host "2. Lancez : npm run dev"
Write-Host "3. Cliquez 5 fois sur le logo (🏥) pour accéder à l'admin"
Write-Host ""
Write-Host "Pour arrêter le serveur : Ctrl+C"
