import { ImageResponse } from 'next/og';

export const alt = 'Ofis Planı — ofis, ev ve tatil günleri';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const TITLE = 'Ofis Planı';
const SUBTITLE = 'Ofis · Ev · Tatil';
const TAGLINE = 'Bugün ofiste mi, evde mi? Takımının güncel planı.';

// The built-in OG font lacks Turkish glyphs (ı, ş, ğ), so load Outfit subset to the text we draw.
async function loadFont(weight, text) {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Outfit:wght@${weight}&text=${encodeURIComponent(text)}`)
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function OpenGraphImage() {
  const [bold, regular] = await Promise.all([loadFont(800, TITLE), loadFont(500, SUBTITLE + TAGLINE)]);
  const fonts = [
    bold && { name: 'Outfit', data: bold, weight: 800 },
    regular && { name: 'Outfit', data: regular, weight: 500 },
  ].filter(Boolean);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 96px',
          background: '#0a0a0a',
          color: '#fafafa',
          fontFamily: 'Outfit',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 28,
              background: '#fafafa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2v4" />
              <path d="M16 2v4" />
              <rect width="18" height="18" x="3" y="4" rx="2" />
              <path d="M3 10h18" />
              <path d="m9 16 2 2 4-4" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>{TITLE}</div>
            <div style={{ fontSize: 34, fontWeight: 500, color: '#a3a3a3', marginTop: 12, letterSpacing: 4, textTransform: 'uppercase' }}>
              {SUBTITLE}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 40, fontWeight: 500, color: '#d4d4d4', marginTop: 64 }}>{TAGLINE}</div>
        <div style={{ display: 'flex', gap: 16, marginTop: 48 }}>
          {['#10b981', '#3b82f6', '#f59e0b'].map((c) => (
            <div key={c} style={{ width: 72, height: 12, borderRadius: 6, background: c }} />
          ))}
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined }
  );
}
