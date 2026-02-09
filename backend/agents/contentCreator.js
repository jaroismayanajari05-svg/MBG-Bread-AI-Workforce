/**
 * Content Creator Agent
 * Generates WhatsApp messages with MBG compliance
 */

let openai = null;

/**
 * Lazy load OpenAI client
 */
async function getOpenAI() {
    if (!openai && process.env.OPENAI_API_KEY &&
        process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
        try {
            const OpenAI = (await import('openai')).default;
            openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            console.log('[ContentCreator] OpenAI client initialized');
        } catch (err) {
            console.error('[ContentCreator] Failed to initialize OpenAI:', err);
        }
    }
    return openai;
}

/**
 * System prompt for GPT
 */
const SYSTEM_PROMPT = `Anda adalah asisten penulis pesan WhatsApp profesional untuk perusahaan roti yang ingin bermitra dengan Dapur MBG (Makan Bergizi Gratis).

ATURAN WAJIB:
1. Bahasa Indonesia yang sopan dan profesional
2. WAJIB menyebutkan: Halal MUI, SLHS (Sertifikat Laik Higiene Sanitasi)
3. WAJIB menyebutkan kepatuhan terhadap Perpres No. 83 Tahun 2024 tentang MBG
4. Produk utama: Roti gandum utuh tinggi serat
5. Maksimal 700 karakter
6. Salam pembuka: "Assalamualaikum Wr. Wb."
7. Salam penutup: "Wassalamualaikum Wr. Wb."
8. Tidak menyebutkan harga atau diskon
9. Ajakan untuk diskusi lebih lanjut
10. Gunakan emoji secukupnya untuk keramahan`;

/**
 * Generate message using AI or template
 */
async function generateMessage(lead) {
    const client = await getOpenAI();

    if (client) {
        try {
            return await generateWithAI(client, lead);
        } catch (err) {
            console.error('[ContentCreator] AI generation failed, using template:', err);
            return generateFromTemplate(lead);
        }
    }

    return generateFromTemplate(lead);
}

/**
 * Generate message using OpenAI
 */
async function generateWithAI(client, lead) {
    const userPrompt = `Buatkan pesan WhatsApp penawaran roti untuk:
- Nama Dapur: ${lead.nama_sppg}
- Lokasi: ${lead.kab_kota}, ${lead.provinsi}
- Kecamatan: ${lead.kecamatan || '-'}`;

    const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.7
    });

    const message = response.choices[0]?.message?.content?.trim();

    if (!message) {
        throw new Error('Empty AI response');
    }

    if (message.length > 700) {
        return message.substring(0, 697) + '...';
    }

    return message;
}

/**
 * Generate message from template (fallback)
 */
function generateFromTemplate(lead) {
    const nama = lead.nama_sppg || 'Dapur MBG';

    const template = `Assalamualaikum Wr. Wb.

Perkenalkan, kami dari CV Roti Sehat Indonesia ingin menawarkan kerjasama penyediaan roti untuk ${nama}.

Keunggulan produk kami:
🌾 Roti gandum utuh tinggi serat
✅ Bersertifikat HALAL MUI
✅ Memiliki SLHS (Sertifikat Laik Higiene Sanitasi)
✅ Sesuai standar gizi Perpres No. 83/2024 MBG

Kami siap mendukung program Makan Bergizi Gratis dengan produk roti berkualitas tinggi untuk anak-anak Indonesia.

Apakah Bapak/Ibu berkenan untuk kami jelaskan lebih lanjut?

Terima kasih 🙏
Wassalamualaikum Wr. Wb.`;

    return template;
}

/**
 * Validate message compliance
 */
function validateCompliance(message) {
    const checks = {
        hasHalal: /halal/i.test(message),
        hasSLHS: /slhs/i.test(message),
        hasPerpres: /perpres|83.*2024|mbg/i.test(message),
        hasRoti: /roti/i.test(message),
        lengthOk: message.length <= 700
    };

    const passed = Object.values(checks).every(v => v);

    return {
        passed,
        checks,
        message: passed ? 'Pesan sesuai standar' : 'Pesan perlu diperbaiki'
    };
}

export default {
    generateMessage,
    generateFromTemplate,
    validateCompliance
};
