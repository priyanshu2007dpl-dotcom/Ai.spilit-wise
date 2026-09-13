import { ParsedExpense, ExpenseCategory } from './types';

const CATEGORY_KEYWORDS: Record<ExpenseCategory, string[]> = {
  food: ['dinner', 'lunch', 'breakfast', 'food', 'meal', 'restaurant', 'pizza', 'burger', 'snack', 'tea', 'coffee', 'cafe', 'eat', 'brunch', 'supper', 'tiffin', 'biryani'],
  transport: ['taxi', 'cab', 'uber', 'auto', 'bus', 'train', 'fuel', 'petrol', 'diesel', 'rickshaw', 'ride', 'travel', 'metro', 'flight', 'parking'],
  hotel: ['hotel', 'stay', 'room', 'accommodation', 'lodging', 'resort', 'airbnb', 'guest house', 'booking'],
  shopping: ['shopping', 'clothes', 'shirt', 'shoes', 'mall', 'store', 'purchase', 'gift', 'amazon', 'flipkart'],
  entertainment: ['movie', 'game', 'concert', 'show', 'party', 'entertainment', 'netflix', 'pub', 'club', 'bowling', 'arcade'],
  groceries: ['groceries', 'grocery', 'vegetables', 'fruits', 'milk', 'bread', 'supermarket', 'kirana', 'ration', 'provisions'],
  bills: ['bill', 'electricity', 'water', 'gas', 'internet', 'wifi', 'phone', 'recharge', 'rent', 'maintenance', 'dth'],
  tickets: ['ticket', 'tickets', 'entry', 'pass', 'admission', 'museum', 'zoo', 'theme park', 'ferry', 'boat'],
  other: [],
};

const STOP_WORDS = new Set([
  'i', 'me', 'my', 'we', 'us', 'our', 'for', 'the', 'a', 'an', 'and', 'with',
  'to', 'of', 'on', 'at', 'in', 'is', 'was', 'paid', 'pay', 'spend', 'spent',
  'bought', 'share', 'split', 'between', 'among', 'all', 'everyone', 'yesterday',
  'today', 'tomorrow', 'from', 'by', 'it', 'this', 'that', 'rs', 'inr', 'rupees',
]);

function detectCategory(text: string): ExpenseCategory {
  const lower = text.toLowerCase();
  let bestCategory: ExpenseCategory = 'other';
  let bestScore = 0;

  (Object.keys(CATEGORY_KEYWORDS) as ExpenseCategory[]).forEach((cat) => {
    const keywords = CATEGORY_KEYWORDS[cat];
    let score = 0;
    keywords.forEach((kw) => {
      if (lower.includes(kw)) score++;
    });
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat;
    }
  });

  return bestCategory;
}

function detectAmount(text: string): number | null {
  const patterns = [
    /(?:₹|rs\.?|inr\.?)\s*(\d+(?:,\d+)*(?:\.\d+)?)/i,
    /(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:₹|rs\.?|inr\.?)/i,
    /(\d+(?:,\d+)*(?:\.\d+)?)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const num = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(num) && num > 0) return num;
    }
  }

  return null;
}

function detectDate(text: string): string | null {
  const lower = text.toLowerCase();
  const today = new Date();

  if (lower.includes('yesterday')) {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }
  if (lower.includes('today')) {
    return today.toISOString().split('T')[0];
  }
  if (lower.includes('tomorrow')) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  return null;
}

function detectPayer(text: string): string | null {
  const lower = text.toLowerCase();

  if (lower.match(/\bi\b\s*(paid|pay|spent|bought)/) || lower.match(/^(?:i|me)\b/)) {
    return '__me__';
  }

  const paidMatch = lower.match(/(\w+)\s+(?:paid|pay|spent|bought)/);
  if (paidMatch && !STOP_WORDS.has(paidMatch[1])) {
    return paidMatch[1];
  }

  const byMatch = lower.match(/paid\s+by\s+(\w+)/);
  if (byMatch && !STOP_WORDS.has(byMatch[1])) {
    return byMatch[1];
  }

  return null;
}

function detectParticipants(text: string): string[] {
  const lower = text.toLowerCase();

  if (lower.includes('everyone') || lower.includes('all members') || lower.includes('everybody')) {
    return ['__all__'];
  }

  if (lower.includes('for me') && !lower.includes('and')) {
    return ['__me__'];
  }

  const participants: string[] = [];

  if (lower.includes('me') || lower.includes('i ') || lower.match(/\bi\b/)) {
    participants.push('__me__');
  }

  const forPattern = lower.match(/for\s+(.+?)(?:\.|$)/);
  if (forPattern) {
    const afterFor = forPattern[1];
    const andSplit = afterFor.split(/\s+and\s+|\s*,\s*/);
    andSplit.forEach((name) => {
      const cleaned = name.trim()
        .replace(/^(the\s+|all\s+|everyone\s+)/, '')
        .replace(/\b(members?|people|persons?)\b/g, '')
        .trim();
      if (cleaned && !STOP_WORDS.has(cleaned) && cleaned.length > 1) {
        const words = cleaned.split(/\s+/);
        const lastName = words[words.length - 1];
        if (!participants.includes(lastName) && !STOP_WORDS.has(lastName)) {
          participants.push(lastName);
        }
      }
    });
  }

  if (participants.length === 0) {
    const words = lower.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      const word = words[i].replace(/[^a-z]/g, '');
      if (word && !STOP_WORDS.has(word) && word.length > 2 &&
          !CATEGORY_KEYWORDS.food.includes(word) &&
          !CATEGORY_KEYWORDS.transport.includes(word)) {
        const nextWord = words[i + 1]?.replace(/[^a-z]/g, '');
        if (nextWord && !STOP_WORDS.has(nextWord) && nextWord.length > 2) {
          if (!participants.includes(word) && !participants.includes(nextWord)) {
            participants.push(word, nextWord);
          }
          break;
        }
      }
    }
  }

  if (participants.length === 0) {
    return ['__all__'];
  }

  return [...new Set(participants)];
}

function detectDescription(text: string): string | null {
  const lower = text.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return kw.charAt(0).toUpperCase() + kw.slice(1);
      }
    }
  }

  const cleaned = text
    .replace(/(?:₹|rs\.?|inr\.?)\s*\d+(?:,\d+)*(?:\.\d+)?/gi, '')
    .replace(/\d+(?:,\d+)*(?:\.\d+)?\s*(?:₹|rs\.?|inr\.?)/gi, '')
    .replace(/\b(i|me|paid|pay|for|and|the|a|an|split|between|among|everyone|all|yesterday|today|tomorrow)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length > 0) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return null;
}

/**
 * Parse natural language expense text into structured data.
 * This is a deterministic parser — no external AI API needed.
 * It extracts amount, payer, participants, description, category, and date.
 */
export function parseExpenseText(text: string): ParsedExpense {
  const amount = detectAmount(text);
  const payerName = detectPayer(text);
  const participantNames = detectParticipants(text);
  const description = detectDescription(text);
  const category = detectCategory(text);
  const date = detectDate(text);

  const needsClarification = amount === null || (participantNames.length === 0);

  let clarificationQuestion: string | null = null;
  if (needsClarification) {
    if (amount === null) {
      clarificationQuestion = 'How much was the expense?';
    } else if (participantNames.length === 0) {
      clarificationQuestion = 'Who should this expense be split with?';
    }
  }

  return {
    amount,
    description,
    payerName,
    participantNames,
    category,
    date,
    needsClarification,
    clarificationQuestion,
  };
}

/**
 * Resolve participant names to user IDs using group members.
 */
export function resolveParticipants(
  parsedParticipantNames: string[],
  members: { user_id: string; profile?: { name: string } }[],
  currentUserId: string
): string[] {
  if (parsedParticipantNames.includes('__all__')) {
    return members.map((m) => m.user_id);
  }

  const resolved: string[] = [];

  parsedParticipantNames.forEach((name) => {
    if (name === '__me__') {
      if (!resolved.includes(currentUserId)) resolved.push(currentUserId);
      return;
    }

    const member = members.find((m) => {
      const memberName = m.profile?.name?.toLowerCase() || '';
      return memberName.includes(name.toLowerCase()) || name.toLowerCase().includes(memberName);
    });

    if (member && !resolved.includes(member.user_id)) {
      resolved.push(member.user_id);
    }
  });

  return resolved;
}

/**
 * Resolve payer name to user ID.
 */
export function resolvePayer(
  payerName: string | null,
  members: { user_id: string; profile?: { name: string } }[],
  currentUserId: string
): string {
  if (!payerName || payerName === '__me__') return currentUserId;

  const member = members.find((m) => {
    const memberName = m.profile?.name?.toLowerCase() || '';
    return memberName.includes(payerName.toLowerCase()) || payerName.toLowerCase().includes(memberName);
  });

  return member?.user_id || currentUserId;
}
