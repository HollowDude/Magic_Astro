// src/types/nodehive.paragraphs.ts

import type { NodeHiveMedia } from './nodehive.commerce';

export interface ButtonParagraph {
  type: 'paragraph--button';
  id: string;
  field_button_text: string;
  field_button_link: {
    uri: string;
    title: string | null;
  };
  field_button_style: 'primary' | 'secondary';
}

export interface HeroCarouselParagraph {
  type: 'paragraph--hero_carousel';
  id: string;
  field_title?: string;
  field_subtitle?: string;
  field_description?: string;
  field_hero_images: NodeHiveMedia[];
  field_cta_buttons: ButtonParagraph[];
}

export interface PageComponents {
  data: HeroCarouselParagraph[];
}

export interface HeroSlide {
  image: string;
  label: string;
}

export interface HeroData {
  title: string | null;
  subtitle: string | null;
  description: string | null;
  slides: HeroSlide[];
  ctaButtons: Array<{
    text: string;
    url: string;
    style: 'primary' | 'secondary';
  }>;
}