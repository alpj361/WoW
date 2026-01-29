const express = require('express');
const router = express.Router();
const { analyzeEventImage, validateImageData } = require('../services/eventVision');
const { extractInstagramPost, isValidInstagramUrl } = require('../services/instagramExtractor');
const { getDatabase } = require('../utils/mongodb');

/**
 * POST /api/events/analyze-image
 * Analyze event image and extract structured data
 */
router.post('/analyze-image', async (req, res) => {
  try {
    const { image, title } = req.body;

    // Validate request
    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Image data is required'
      });
    }

    // Validate image format
    const validation = validateImageData(image);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    console.log('[IMAGE_ANALYSIS] Processing image analysis request');

    // Analyze image with OpenAI Vision
    const result = await analyzeEventImage(image, title);

    // Save analysis to MongoDB
    try {
      const db = getDatabase();
      const analysisDoc = {
        image_url: image.startsWith('http') ? image : 'base64_data',
        analysis: result.analysis,
        metadata: result.metadata,
        created_at: new Date()
      };

      await db.collection('event_analyses').insertOne(analysisDoc);
      console.log('[IMAGE_ANALYSIS] ✅ Analysis saved to MongoDB');
    } catch (dbError) {
      console.error('[IMAGE_ANALYSIS] ⚠️ MongoDB save error:', dbError.message);
      // Continue even if DB save fails
    }

    // Return success response
    res.json({
      success: true,
      analysis: result.analysis,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('[IMAGE_ANALYSIS] ❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze image',
      message: error.message
    });
  }
});

/**
 * POST /api/events/analyze-url
 * Analyze event from Instagram post URL
 */
router.post('/analyze-url', async (req, res) => {
  try {
    const { url } = req.body;

    // Validate request
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    // Validate Instagram URL format
    if (!isValidInstagramUrl(url)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Instagram URL. Use format: https://instagram.com/p/POST_ID or https://instagram.com/reel/POST_ID'
      });
    }

    console.log('[URL_ANALYSIS] Processing Instagram URL:', url);

    // Step 1: Extract image and metadata from Instagram
    let extracted;
    try {
      extracted = await extractInstagramPost(url);
      console.log('[URL_ANALYSIS] ✅ Successfully extracted Instagram post');
    } catch (extractError) {
      console.error('[URL_ANALYSIS] ❌ Extraction failed:', extractError.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to extract Instagram post',
        message: extractError.message
      });
    }

    // Step 2: Analyze extracted image with OpenAI Vision
    let analysisResult;
    try {
      analysisResult = await analyzeEventImage(
        extracted.image_url,
        extracted.caption || 'Instagram Event Post'
      );
      console.log('[URL_ANALYSIS] ✅ Image analysis completed');
    } catch (analysisError) {
      console.error('[URL_ANALYSIS] ❌ Analysis failed:', analysisError.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to analyze image',
        message: analysisError.message
      });
    }

    // Step 3: Save to MongoDB
    try {
      const db = getDatabase();
      const urlAnalysisDoc = {
        source_url: url,
        platform: 'instagram',
        post_id: extracted.post_id,
        extracted_image_url: extracted.image_url,
        post_metadata: {
          author: extracted.author,
          caption: extracted.caption
        },
        analysis: analysisResult.analysis,
        metadata: analysisResult.metadata,
        created_at: new Date()
      };

      await db.collection('url_analyses').insertOne(urlAnalysisDoc);
      console.log('[URL_ANALYSIS] ✅ Analysis saved to MongoDB');
    } catch (dbError) {
      console.error('[URL_ANALYSIS] ⚠️ MongoDB save error:', dbError.message);
      // Continue even if DB save fails
    }

    // Step 4: Return combined result
    res.json({
      success: true,
      source_url: url,
      platform: 'instagram',
      extracted_image_url: extracted.image_url,
      post_metadata: {
        author: extracted.author,
        description: extracted.caption
      },
      analysis: analysisResult.analysis,
      metadata: analysisResult.metadata
    });

  } catch (error) {
    console.error('[URL_ANALYSIS] ❌ Unexpected error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    });
  }
});

module.exports = router;
