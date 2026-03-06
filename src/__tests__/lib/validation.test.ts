import { authSchemas, hotkeySchemas, sanitizeInput, validateRequest, isValidEmail, isValidWalletAddress } from '@/lib/validation';

describe('Validation', () => {
  describe('authSchemas', () => {
    describe('signup', () => {
      it('should validate correct signup data', async () => {
        const data = {
          email: 'test@example.com',
          password: 'Test123!@#',
          name: 'Test User',
          role: 'human' as const,
        };
        
        const result = await authSchemas.signup.parseAsync(data);
        expect(result.email).toBe('test@example.com');
      });
      
      it('should reject weak password', async () => {
        const data = {
          email: 'test@example.com',
          password: 'weak',
          name: 'Test User',
          role: 'human' as const,
        };
        
        await expect(authSchemas.signup.parseAsync(data)).rejects.toThrow();
      });
      
      it('should reject invalid email', async () => {
        const data = {
          email: 'invalid-email',
          password: 'Test123!@#',
          name: 'Test User',
          role: 'human' as const,
        };
        
        await expect(authSchemas.signup.parseAsync(data)).rejects.toThrow();
      });
    });
    
    describe('signin', () => {
      it('should validate correct signin data', async () => {
        const data = {
          email: 'test@example.com',
          password: 'any-password',
        };
        
        const result = await authSchemas.signin.parseAsync(data);
        expect(result.email).toBe('test@example.com');
      });
    });
  });
  
  describe('hotkeySchemas', () => {
    describe('create', () => {
      it('should validate correct hotkey data', async () => {
        const data = {
          title: 'Test Hotkey',
          description: 'This is a test hotkey description',
          price: 9.99,
          category: 'productivity' as const,
          isPublic: true,
          content: {
            trigger: 'test',
            action: 'Run test action',
            instructions: 'These are detailed instructions for the test hotkey',
          },
        };
        
        const result = await hotkeySchemas.create.parseAsync(data);
        expect(result.title).toBe('Test Hotkey');
      });
      
      it('should reject invalid price', async () => {
        const data = {
          title: 'Test Hotkey',
          description: 'This is a test hotkey description',
          price: -1,
          category: 'productivity' as const,
          content: {
            trigger: 'test',
            action: 'Run test action',
            instructions: 'These are detailed instructions',
          },
        };
        
        await expect(hotkeySchemas.create.parseAsync(data)).rejects.toThrow();
      });
    });
    
    describe('query', () => {
      it('should set default values', async () => {
        const result = await hotkeySchemas.query.parseAsync({});
        expect(result.page).toBe(1);
        expect(result.limit).toBe(20);
        expect(result.sortBy).toBe('createdAt');
        expect(result.order).toBe('desc');
      });
      
      it('should coerce string numbers', async () => {
        const result = await hotkeySchemas.query.parseAsync({
          page: '2',
          limit: '50',
        });
        expect(result.page).toBe(2);
        expect(result.limit).toBe(50);
      });
    });
  });
  
  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello');
    });
    
    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello World');
    });
  });
  
  describe('validateRequest', () => {
    it('should validate and sanitize data', async () => {
      const schema = authSchemas.signin;
      const data = {
        email: '  TEST@EXAMPLE.COM  ',
        password: '<script>password</script>',
      };
      
      const result = await validateRequest(schema, data);
      expect(result.email).toBe('test@example.com');
      expect(result.password).toBe('password');
    });
    
    it('should throw validation error', async () => {
      const schema = authSchemas.signin;
      const data = {
        email: 'invalid',
        password: '',
      };
      
      await expect(validateRequest(schema, data)).rejects.toThrow('Validation failed');
    });
  });
  
  describe('utility functions', () => {
    it('should validate email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('no@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });
    
    it('should validate wallet addresses', () => {
      expect(isValidWalletAddress('0x1234567890123456789012345678901234567890')).toBe(true);
      expect(isValidWalletAddress('0x123')).toBe(false);
      expect(isValidWalletAddress('invalid')).toBe(false);
      expect(isValidWalletAddress('1234567890123456789012345678901234567890')).toBe(false);
    });
  });
});