import { InstagramPost } from '../types/place';

/**
 * Instagram Service using Supadata for scraping
 * Supadata is a web scraping service that can extract Instagram data
 */

// Mock Instagram posts for now - In production, this would call Supadata API
export const fetchInstagramPosts = async (instagramHandle: string): Promise<InstagramPost[]> => {
  // In production, you would call Supadata API here
  // Example: const response = await fetch(`https://api.supadata.ai/instagram/${instagramHandle}`);
  
  // For now, returning mock data with realistic structure
  const mockPosts: InstagramPost[] = [
    {
      id: '1',
      imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
      caption: 'Fresh brew every morning ☕️',
      likes: 234,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      permalink: `https://instagram.com/${instagramHandle}/p/1`,
    },
    {
      id: '2',
      imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
      caption: 'New seasonal menu 🍂',
      likes: 189,
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      permalink: `https://instagram.com/${instagramHandle}/p/2`,
    },
    {
      id: '3',
      imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400',
      caption: 'Sunday vibes ✨',
      likes: 312,
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      permalink: `https://instagram.com/${instagramHandle}/p/3`,
    },
  ];

  return mockPosts;
};

/**
 * Format Instagram post count for display
 */
export const formatPostCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

/**
 * Get time ago string for post timestamp
 */
export const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - new Date(date).getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  return `${Math.floor(diffInDays / 30)} months ago`;
};

/**
 * Validate Instagram handle format
 */
export const isValidInstagramHandle = (handle: string): boolean => {
  // Instagram handles: 1-30 characters, letters, numbers, periods, underscores
  const regex = /^[a-zA-Z0-9._]{1,30}$/;
  return regex.test(handle);
};
