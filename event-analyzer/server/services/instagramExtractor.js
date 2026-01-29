const axios = require('axios');

// Usar el servicio externo de Pulse Journal
const INSTAGRAM_API_URL = 'https://api.standatpd.com/instagram/simple';

/**
 * Extract image URL and metadata from Instagram post
 * Uses external Instagram scraping service at api.standatpd.com
 * @param {string} postUrl - Instagram post URL (e.g., https://instagram.com/p/ABC123)
 * @returns {Promise<Object>} Extracted data with image_url, caption, author
 */
async function extractInstagramPost(postUrl) {
  try {
    console.log('[INSTAGRAM_EXTRACTOR] 🌐 Using external API:', INSTAGRAM_API_URL);
    console.log('[INSTAGRAM_EXTRACTOR] Processing URL:', postUrl);

    // Validate URL format
    const urlPattern = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/;
    const match = postUrl.match(urlPattern);

    if (!match) {
      throw new Error('Invalid Instagram URL format. Use format: https://instagram.com/p/POST_ID');
    }

    const postId = match[1];
    console.log('[INSTAGRAM_EXTRACTOR] Post ID:', postId);

    // Llamar al servicio externo de Pulse Journal
    const response = await axios.post(
      INSTAGRAM_API_URL,
      { url: postUrl },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 45000, // 45 segundos (el servicio puede tardar ~40s)
      }
    );

    const data = response.data;

    // Verificar respuesta exitosa
    if (!data.success) {
      throw new Error(data.error || 'Failed to extract Instagram post');
    }

    // Extraer la primera imagen del array de media
    const firstMedia = data.media && data.media.length > 0 ? data.media[0] : null;
    
    if (!firstMedia || !firstMedia.url) {
      throw new Error('No media found in Instagram post');
    }

    console.log('[INSTAGRAM_EXTRACTOR] ✅ Successfully extracted via external API');
    console.log('[INSTAGRAM_EXTRACTOR] Author:', data.author);
    console.log('[INSTAGRAM_EXTRACTOR] Media type:', firstMedia.type);
    console.log('[INSTAGRAM_EXTRACTOR] Media count:', data.media.length);

    // Retornar en el formato esperado
    return {
      image_url: firstMedia.url,
      caption: data.description || 'No caption available',
      author: data.author || 'Unknown',
      post_id: data.post_id || postId,
      source_url: postUrl,
      // Incluir todos los medios para referencia
      all_media: data.media
    };

  } catch (error) {
    console.error('[INSTAGRAM_EXTRACTOR] ❌ Error:', error.message);
    
    // Manejar errores específicos
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      
      if (status === 404) {
        throw new Error('Instagram post not found or is private. Make sure the post is public.');
      } else if (status === 429) {
        throw new Error('Rate limited by Instagram service. Please try again later.');
      } else if (status === 500) {
        throw new Error(`Instagram extraction service error: ${errorData?.detail || 'Internal server error'}`);
      }
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error('Connection to Instagram extraction service timed out. Please try again.');
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('Instagram extraction service is unavailable. Please try again later.');
    }
    
    throw new Error(`Failed to extract Instagram post: ${error.message}`);
  }
}

/**
 * Validate Instagram URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid Instagram post URL
 */
function isValidInstagramUrl(url) {
  const pattern = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel)\/[A-Za-z0-9_-]+/;
  return pattern.test(url);
}

/**
 * Extract post ID from Instagram URL
 * @param {string} url - Instagram URL
 * @returns {string|null} Post ID or null if invalid
 */
function extractPostId(url) {
  const match = url.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

module.exports = {
  extractInstagramPost,
  isValidInstagramUrl,
  extractPostId
};
