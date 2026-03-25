import { prisma } from '@/lib/prisma';

describe('Prisma Test', () => {
  it('should import prisma', () => {
    expect(prisma).toBeDefined();
  });
});
