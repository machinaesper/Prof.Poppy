const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ─── Pokémon Type Chart ──────────────────────────────────────────────────────
const TYPES = [
  'Normal','Fire','Water','Electric','Grass','Ice',
  'Fighting','Poison','Ground','Flying','Psychic','Bug',
  'Rock','Ghost','Dragon','Dark','Steel','Fairy'
];

// Effectiveness: [attacker type][defender type] = multiplier
// 0=immune, 0.5=resist, 1=normal, 2=super
const TYPE_CHART = {
  Normal:   { Rock:0.5, Ghost:0, Steel:0.5 },
  Fire:     { Fire:0.5, Water:0.5, Grass:2, Ice:2, Bug:2, Rock:0.5, Dragon:0.5, Steel:2 },
  Water:    { Fire:2, Water:0.5, Grass:0.5, Ground:2, Rock:2, Dragon:0.5 },
  Electric: { Water:2, Electric:0.5, Grass:0.5, Ground:0, Flying:2, Dragon:0.5 },
  Grass:    { Fire:0.5, Water:2, Grass:0.5, Poison:0.5, Ground:2, Flying:0.5, Bug:0.5, Rock:2, Dragon:0.5, Steel:0.5 },
  Ice:      { Fire:0.5, Water:0.5, Grass:2, Ice:0.5, Ground:2, Flying:2, Dragon:2, Steel:0.5 },
  Fighting: { Normal:2, Ice:2, Poison:0.5, Flying:0.5, Psychic:0.5, Bug:0.5, Rock:2, Ghost:0, Dark:2, Steel:2, Fairy:0.5 },
  Poison:   { Grass:2, Poison:0.5, Ground:0.5, Rock:0.5, Ghost:0.5, Steel:0, Fairy:2 },
  Ground:   { Fire:2, Electric:2, Grass:0.5, Poison:2, Flying:0, Bug:0.5, Rock:2, Steel:2 },
  Flying:   { Electric:0.5, Grass:2, Fighting:2, Bug:2, Rock:0.5, Steel:0.5 },
  Psychic:  { Fighting:2, Poison:2, Psychic:0.5, Dark:0, Steel:0.5 },
  Bug:      { Fire:0.5, Grass:2, Fighting:0.5, Poison:0.5, Flying:0.5, Psychic:2, Ghost:0.5, Dark:2, Steel:0.5, Fairy:0.5 },
  Rock:     { Fire:2, Ice:2, Fighting:0.5, Ground:0.5, Flying:2, Bug:2, Steel:0.5 },
  Ghost:    { Normal:0, Psychic:2, Ghost:2, Dark:0.5 },
  Dragon:   { Dragon:2, Steel:0.5, Fairy:0 },
  Dark:     { Fighting:0.5, Psychic:2, Ghost:2, Dark:0.5, Fairy:0.5 },
  Steel:    { Fire:0.5, Water:0.5, Electric:0.5, Ice:2, Rock:2, Steel:0.5, Fairy:2 },
  Fairy:    { Fire:0.5, Fighting:2, Poison:0.5, Dragon:2, Dark:2, Steel:0.5 },
};

// Type colours (hex)
const TYPE_COLORS = {
  Normal:'#A8A77A', Fire:'#EE8130', Water:'#6390F0', Electric:'#F7D02C',
  Grass:'#7AC74C', Ice:'#96D9D6', Fighting:'#C22E28', Poison:'#A33EA1',
  Ground:'#E2BF65', Flying:'#A98FF3', Psychic:'#F95587', Bug:'#A6B91A',
  Rock:'#B6A136', Ghost:'#735797', Dragon:'#6F35FC', Dark:'#705746',
  Steel:'#B7B7CE', Fairy:'#D685AD',
};

function getEffectiveness(attackType, defType1, defType2 = null) {
  const chart = TYPE_CHART[attackType] || {};
  let e1 = chart[defType1] !== undefined ? chart[defType1] : 1;
  let e2 = defType2 ? (chart[defType2] !== undefined ? chart[defType2] : 1) : 1;
  return e1 * e2;
}

// ─── Draw Type Chart Image ────────────────────────────────────────────────────
async function drawTypeChart() {
  const PImage = require('pureimage');
  const path = require('path');
  const { PassThrough } = require('stream');

  const TYPE_ABBR = {
    Normal:'NRM', Fire:'FIR', Water:'WTR', Electric:'ELC', Grass:'GRS', Ice:'ICE',
    Fighting:'FGT', Poison:'PSN', Ground:'GRD', Flying:'FLY', Psychic:'PSY', Bug:'BUG',
    Rock:'ROK', Ghost:'GHO', Dragon:'DRG', Dark:'DRK', Steel:'STL', Fairy:'FAI',
  };

  const font = PImage.registerFont(path.join(__dirname, 'font.ttf'), 'F');
  await font.load();

  const CELL = 38, HEADER = 52;
  const W = HEADER + TYPES.length * CELL;
  const H = HEADER + TYPES.length * CELL + 28;

  const img = PImage.make(W, H);
  const ctx = img.getContext('2d');

  // Background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, W, H);

  // Column headers — stack chars vertically
  TYPES.forEach((t, i) => {
    const x = HEADER + i * CELL;
    const abbr = TYPE_ABBR[t];
    ctx.fillStyle = TYPE_COLORS[t];
    ctx.fillRect(x + 1, 2, CELL - 2, HEADER - 2);
    ctx.fillStyle = 'white';
    ctx.font = '11px F';
    for (let c = 0; c < abbr.length; c++) {
      ctx.fillText(abbr[c], x + CELL / 2 - 4, 12 + c * 14);
    }
  });

  // Row headers
  TYPES.forEach((t, i) => {
    const y = HEADER + i * CELL;
    const abbr = TYPE_ABBR[t];
    ctx.fillStyle = TYPE_COLORS[t];
    ctx.fillRect(1, y + 1, HEADER - 2, CELL - 2);
    ctx.fillStyle = 'white';
    ctx.font = '10px F';
    ctx.fillText(abbr, 6, y + CELL / 2 + 4);
  });

  // Cells
  TYPES.forEach((atk, ai) => {
    TYPES.forEach((def, di) => {
      const eff = getEffectiveness(atk, def);
      const x = HEADER + di * CELL;
      const y = HEADER + ai * CELL;
      let bg = '#1e1e3a', text = '', textColor = '#ffffff';
      if      (eff === 0)    { bg = '#2a2a2a'; text = 'X';   textColor = '#666666'; }
      else if (eff === 0.25) { bg = '#6b0000'; text = '1/4'; }
      else if (eff === 0.5)  { bg = '#8b1a1a'; text = '1/2'; }
      else if (eff === 2)    { bg = '#1a5c1a'; text = '2';   }
      else if (eff === 4)    { bg = '#0a3d0a'; text = '4';   }
      ctx.fillStyle = bg;
      ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
      if (text) {
        ctx.fillStyle = textColor;
        ctx.font = '11px F';
        ctx.fillText(text, x + (text.length > 1 ? 4 : 13), y + CELL / 2 + 4);
      }
    });
  });

  // Legend
  const ly = HEADER + TYPES.length * CELL + 14;
  [
    { col:'#1a5c1a', label:'2 = Super Effective' },
    { col:'#8b1a1a', label:'1/2 = Not Very Effective' },
    { col:'#2a2a2a', label:'X = Immune' },
  ].forEach((item, i) => {
    const lx = 8 + i * 220;
    ctx.fillStyle = item.col;
    ctx.fillRect(lx, ly - 9, 11, 11);
    ctx.fillStyle = '#bbbbbb';
    ctx.font = '10px F';
    ctx.fillText(item.label, lx + 15, ly + 1);
  });

  return new Promise((resolve, reject) => {
    const chunks = [];
    const stream = new PassThrough();
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
    PImage.encodePNGToStream(img, stream).catch(reject);
  });
}

// ─── Fetch Pokémon from PokéAPI ──────────────────────────────────────────────
async function fetchPokemon(nameOrId) {
  const fetch = (await import('node-fetch')).default;
  let name = nameOrId.toLowerCase().trim().replace(/\s+/g, '-');

  // แปลง "mega-charizard-x" → "charizard-mega-x"
  const megaMatch = name.match(/^mega-(.+?)(?:-(x|y))?$/);
  if (megaMatch) {
    name = megaMatch[2]
      ? `${megaMatch[1]}-mega-${megaMatch[2]}`
      : `${megaMatch[1]}-mega`;
  }
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
  if (!res.ok) return null;
  const data = await res.json();

  const speciesRes = await fetch(data.species.url);
  const species = await speciesRes.json();

  const engName = species.names.find(n => n.language.name === 'en')?.name || data.name;
  const flavorEntry = species.flavor_text_entries
    .filter(f => f.language.name === 'en')
    .pop();
  const flavorText = flavorEntry
    ? flavorEntry.flavor_text.replace(/\f|\n/g, ' ')
    : 'No description available.';

  const types = data.types.map(t => capitalize(t.type.name));
  const abilities = data.abilities.map(a => ({
    name: capitalize(a.ability.name.replace(/-/g, ' ')),
    hidden: a.is_hidden,
  }));

  const stats = {};
  data.stats.forEach(s => {
    stats[s.stat.name] = s.base_stat;
  });

  // Calculate weaknesses/resistances from types
  const weaknesses = [], resistances = [], immunities = [];
  TYPES.forEach(atk => {
    const eff = getEffectiveness(atk, types[0], types[1] || null);
    if (eff === 0)      immunities.push(atk);
    else if (eff >= 2)  weaknesses.push(eff === 4 ? `${atk}(×4)` : atk);
    else if (eff <= 0.5) resistances.push(eff === 0.25 ? `${atk}(×¼)` : atk);
  });

  return {
    id: data.id,
    name: engName,
    slug: data.name,
    sprite: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
    types,
    abilities,
    stats,
    weaknesses,
    resistances,
    immunities,
    flavorText,
    weight: (data.weight / 10).toFixed(1),
    height: (data.height / 10).toFixed(1),
  };
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function typeEmoji(t) {
  const map = {
    Normal:'⬜', Fire:'🔥', Water:'💧', Electric:'⚡', Grass:'🌿', Ice:'❄️',
    Fighting:'🥊', Poison:'☠️', Ground:'🌍', Flying:'🌬️', Psychic:'🔮', Bug:'🐛',
    Rock:'🪨', Ghost:'👻', Dragon:'🐉', Dark:'🌑', Steel:'⚙️', Fairy:'🌸',
  };
  return map[t] || '';
}

// ─── Build /check Embed ──────────────────────────────────────────────────────
function buildPokemonEmbed(p) {
  const typeStr = p.types.map(t => `${typeEmoji(t)} **${t}**`).join('  ');
  const abilityStr = p.abilities.map(a => a.hidden ? `~~${a.name}~~ *(Hidden)*` : a.name).join(', ');
  const weakStr = p.weaknesses.length ? p.weaknesses.map(t => `${typeEmoji(t.replace(/\(.*\)/, '').trim())} ${t}`).join('  ') : '—';
  const resStr  = p.resistances.length ? p.resistances.map(t => `${typeEmoji(t.replace(/\(.*\)/, '').trim())} ${t}`).join('  ') : '—';
  const immStr  = p.immunities.length  ? p.immunities.map(t => `${typeEmoji(t)} ${t}`).join('  ') : '—';

  const statBar = (val) => {
    const filled = Math.round(val / 20);
    return '█'.repeat(filled) + '░'.repeat(10 - filled) + ` **${val}**`;
  };

  const color = TYPE_COLORS[p.types[0]] || '#ffffff';

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(`#${String(p.id).padStart(4,'0')} ${p.name}`)
    .setDescription(`*${p.flavorText}*`)
    .setThumbnail(p.sprite)
    .addFields(
      { name: '🏷️ Type', value: typeStr, inline: false },
      { name: '📏 Height / Weight', value: `${p.height} m  /  ${p.weight} kg`, inline: false },
      { name: '✨ Abilities', value: abilityStr, inline: false },
      { name: '⚠️ Weak Against', value: weakStr, inline: false },
      { name: '🛡️ Resists', value: resStr, inline: false },
      { name: '🚫 Immune To', value: immStr, inline: false },
      {
        name: '📊 Base Stats',
        value: [
          `HP         ${statBar(p.stats.hp)}`,
          `Attack     ${statBar(p.stats.attack)}`,
          `Defense    ${statBar(p.stats.defense)}`,
          `Sp. Atk    ${statBar(p.stats['special-attack'])}`,
          `Sp. Def    ${statBar(p.stats['special-defense'])}`,
          `Speed      ${statBar(p.stats.speed)}`,
        ].join('\n'),
        inline: false
      }
    )
    .setFooter({ text: `Slug: ${p.slug}  •  Data from PokéAPI` });
}

// ─── Register Commands ───────────────────────────────────────────────────────
async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('elementchart')
      .setDescription('แสดงตารางธาตุโปเกม่อน (Type Effectiveness Chart)'),
    new SlashCommandBuilder()
      .setName('check')
      .setDescription('ดูข้อมูลโปเกม่อน เช่น ธาตุ, Ability, จุดอ่อน')
      .addStringOption(opt =>
        opt.setName('pokemon')
          .setDescription('ชื่อภาษาอังกฤษ เช่น charizard, mega-mewtwo-x')
          .setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName('ability')
      .setDescription('ดูข้อมูล Ability และโปเกม่อนที่มี Ability นี้')
      .addStringOption(opt =>
        opt.setName('name')
          .setDescription('ชื่อ Ability ภาษาอังกฤษ เช่น intimidate, levitate, speed-boost')
          .setRequired(true)
      ),
  ].map(c => c.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
  console.log('✅ Slash commands registered');
}

// ─── Event Handlers ──────────────────────────────────────────────────────────
client.once('ready', async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  await registerCommands();
  client.user.setActivity('Pokémon Type Chart | /help', { type: 0 });
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'elementchart') {
    await interaction.deferReply();
    try {
      const fetch = (await import('node-fetch')).default;
      // ดึงรูปตารางธาตุ
      const imageUrl = 'https://img.pokemondb.net/images/typechart.png';
      const res = await fetch(imageUrl);
      const buf = Buffer.from(await res.arrayBuffer());
      const attachment = new AttachmentBuilder(buf, { name: 'type-chart.png' });
      const embed = new EmbedBuilder()
        .setColor('#1a1a2e')
        .setTitle('🗺️ Pokémon Type Effectiveness Chart (Gen 6+)')
        .setDescription('**แถว = ประเภทโจมตี | คอลัมน์ = ประเภทป้องกัน**\n🟢 ได้เปรียบ  🔴 ไม่ได้เปรียบ  ⬛ Immune')
        .setImage('attachment://type-chart.png')
        .setFooter({ text: 'ใช้ /check [ชื่อโปเกม่อน] เพื่อดูจุดอ่อนของโปเกม่อนแต่ละตัว • Source: Bulbapedia' });
      await interaction.editReply({ embeds: [embed], files: [attachment] });
    } catch (e) {
      console.error(e);
      await interaction.editReply('❌ เกิดข้อผิดพลาดในการโหลดตาราง');
    }
  }

  if (interaction.commandName === 'ability') {
    const query = interaction.options.getString('name');
    await interaction.deferReply();
    try {
      const fetch = (await import('node-fetch')).default;
      const slug = query.toLowerCase().trim().replace(/\s+/g, '-');
      const res = await fetch(`https://pokeapi.co/api/v2/ability/${slug}`);
      if (!res.ok) {
        return interaction.editReply(`❌ ไม่พบ Ability **${query}**\nลองใช้ชื่อภาษาอังกฤษ เช่น \`intimidate\`, \`levitate\`, \`speed-boost\``);
      }
      const data = await res.json();

      // ชื่อภาษาอังกฤษ
      const engName = data.names.find(n => n.language.name === 'en')?.name || data.name;

      // คำอธิบายแบบยาว
      const effect = data.effect_entries.find(e => e.language.name === 'en')?.effect || 'No description available.';

      // คำอธิบายสั้นจากเกม
      const flavorText = data.flavor_text_entries
        .filter(f => f.language.name === 'en')
        .pop()?.flavor_text?.replace(/\f|\n/g, ' ') || '';

      // โปเกม่อนที่มี ability นี้ (แยก normal/hidden)
      const normalPokemon = data.pokemon
        .filter(p => !p.is_hidden)
        .map(p => capitalize(p.pokemon.name.replace(/-/g, ' ')));
      const hiddenPokemon = data.pokemon
        .filter(p => p.is_hidden)
        .map(p => capitalize(p.pokemon.name.replace(/-/g, ' ')));

      // แสดงแค่ 20 ตัวแรกเพื่อไม่ให้ยาวเกิน
      const normalStr = normalPokemon.length
        ? normalPokemon.slice(0, 20).join(', ') + (normalPokemon.length > 20 ? ` _(+${normalPokemon.length - 20} more)_` : '')
        : '—';
      const hiddenStr = hiddenPokemon.length
        ? hiddenPokemon.slice(0, 20).join(', ') + (hiddenPokemon.length > 20 ? ` _(+${hiddenPokemon.length - 20} more)_` : '')
        : '—';

      const embed = new EmbedBuilder()
        .setColor('#7AC74C')
        .setTitle(`✨ ${engName}`)
        .setDescription(`*${flavorText}*\n\n${effect}`)
        .addFields(
          { name: `🔵 Normal Ability (${normalPokemon.length} ตัว)`, value: normalStr, inline: false },
          { name: `🟣 Hidden Ability (${hiddenPokemon.length} ตัว)`, value: hiddenStr, inline: false },
        )
        .setFooter({ text: `Data from PokéAPI • ใช้ /check [ชื่อโปเกม่อน] เพื่อดูข้อมูลเพิ่มเติม` });

      await interaction.editReply({ embeds: [embed] });
    } catch (e) {
      console.error(e);
      await interaction.editReply('❌ เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองใหม่อีกครั้ง');
    }
  }

  if (interaction.commandName === 'check') {
    const query = interaction.options.getString('pokemon');
    await interaction.deferReply();
    try {
      const pokemon = await fetchPokemon(query);
      if (!pokemon) {
        return interaction.editReply(`❌ ไม่พบโปเกม่อน **${query}**\nลองใช้ชื่อภาษาอังกฤษ เช่น \`charizard\`, \`mega-charizard-x\`, \`garchomp\``);
      }
      const embed = buildPokemonEmbed(pokemon);
      await interaction.editReply({ embeds: [embed] });
    } catch (e) {
      console.error(e);
      await interaction.editReply('❌ เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองใหม่อีกครั้ง');
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
