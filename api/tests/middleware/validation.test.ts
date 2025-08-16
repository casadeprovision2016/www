import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateAndSanitize, schemas } from '../../src/middleware/validation';
import { createResponseMock } from '../helpers/testHelpers';

describe('Validation Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRes = createResponseMock();
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('validateAndSanitize', () => {
    const testSchema = z.object({
      name: z.string().min(1, 'Nome é obrigatório'),
      email: z.string().email('Email inválido'),
      age: z.number().min(0, 'Idade deve ser positiva').optional(),
    });

    it('should validate and sanitize valid data', () => {
      mockReq = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          age: 30
        }
      };

      const middleware = validateAndSanitize(testSchema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      });
    });

    it('should sanitize HTML in strings', () => {
      mockReq = {
        body: {
          name: 'John <script>alert("xss")</script> Doe',
          email: 'john@example.com'
        }
      };

      const middleware = validateAndSanitize(testSchema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body.name).not.toContain('<script>');
      expect(mockReq.body.name).toBe('John  Doe');
    });

    it('should handle nested objects', () => {
      const nestedSchema = z.object({
        user: z.object({
          name: z.string(),
          details: z.object({
            bio: z.string()
          })
        })
      });

      mockReq = {
        body: {
          user: {
            name: 'John <b>Doe</b>',
            details: {
              bio: 'A <em>great</em> person <script>alert(1)</script>'
            }
          }
        }
      };

      const middleware = validateAndSanitize(nestedSchema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body.user.name).toBe('John <b>Doe</b>'); // Safe HTML preserved
      expect(mockReq.body.user.details.bio).toBe('A <em>great</em> person '); // Script removed
    });

    it('should handle arrays', () => {
      const arraySchema = z.object({
        tags: z.array(z.string()),
        users: z.array(z.object({
          name: z.string()
        }))
      });

      mockReq = {
        body: {
          tags: ['tag1', 'tag2 <script>alert(1)</script>'],
          users: [
            { name: 'John <script>bad</script>' },
            { name: 'Jane <b>Safe</b>' }
          ]
        }
      };

      const middleware = validateAndSanitize(arraySchema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body.tags[1]).toBe('tag2 ');
      expect(mockReq.body.users[0].name).toBe('John ');
      expect(mockReq.body.users[1].name).toBe('Jane <b>Safe</b>');
    });

    it('should return validation errors for invalid data', () => {
      mockReq = {
        body: {
          name: '', // Invalid: empty name
          email: 'invalid-email', // Invalid: bad email format
          age: -5 // Invalid: negative age
        }
      };

      const middleware = validateAndSanitize(testSchema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Dados de entrada inválidos',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: 'Nome é obrigatório'
          }),
          expect.objectContaining({
            field: 'email',
            message: 'Email inválido'
          }),
          expect.objectContaining({
            field: 'age',
            message: 'Idade deve ser positiva'
          })
        ])
      });
    });

    it('should handle missing required fields', () => {
      mockReq = {
        body: {} // Missing all required fields
      };

      const middleware = validateAndSanitize(testSchema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Dados de entrada inválidos',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: expect.any(String)
          }),
          expect.objectContaining({
            field: 'email',
            message: expect.any(String)
          })
        ])
      });
    });

    it('should handle non-Zod errors gracefully', () => {
      const faultySchema = {
        parse: () => {
          throw new Error('Non-Zod error');
        }
      };

      mockReq = {
        body: { name: 'test' }
      };

      const middleware = validateAndSanitize(faultySchema as any);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro na validação dos dados'
      });
    });
  });

  describe('Schema definitions', () => {
    describe('createEvent schema', () => {
      it('should validate valid event data', () => {
        const validEventData = {
          title: 'Test Event',
          description: 'Test Description',
          date: '2025-08-01',
          time: '18:00',
          location: 'Test Location',
          category: 'culto',
          capacity: 100
        };

        const result = schemas.createEvent.safeParse(validEventData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid event data', () => {
        const invalidEventData = {
          title: '', // Empty title
          description: 'Test Description',
          date: 'invalid-date', // Invalid date format
          time: '25:00', // Invalid time
          location: 'Test Location'
        };

        const result = schemas.createEvent.safeParse(invalidEventData);
        expect(result.success).toBe(false);
      });
    });

    describe('createMember schema', () => {
      it('should validate valid member data', () => {
        const validMemberData = {
          user_id: '550e8400-e29b-41d4-a716-446655444441',
          membership_type: 'efetivo',
          join_date: '2025-01-01T00:00:00Z',
          observacoes: 'Membro ativo'
        };

        const result = schemas.createMember.safeParse(validMemberData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid member data', () => {
        const invalidMemberData = {
          user_id: 'invalid-uuid', // Invalid UUID
          membership_type: 'invalid-type', // Invalid enum value
          join_date: 'invalid-date', // Invalid datetime
        };

        const result = schemas.createMember.safeParse(invalidMemberData);
        expect(result.success).toBe(false);
      });
    });

    describe('createStream schema', () => {
      it('should validate valid stream data', () => {
        const validStreamData = {
          titulo: 'Live Stream',
          descricao: 'Test Stream',
          url_stream: 'https://youtube.com/live/test',
          data_inicio: '2025-08-01T10:00:00Z',
          publico: true
        };

        const result = schemas.createStream.safeParse(validStreamData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid stream data', () => {
        const invalidStreamData = {
          titulo: '', // Empty title
          url_stream: 'not-a-url', // Invalid URL
          data_inicio: 'invalid-date' // Invalid datetime
        };

        const result = schemas.createStream.safeParse(invalidStreamData);
        expect(result.success).toBe(false);
      });
    });

    describe('pagination schema', () => {
      it('should validate valid pagination parameters', () => {
        const validPagination = {
          page: 1,
          limit: 10,
          sort: 'created_at',
          order: 'desc'
        };

        const result = schemas.pagination.safeParse(validPagination);
        expect(result.success).toBe(true);
      });

      it('should use default values for missing parameters', () => {
        const result = schemas.pagination.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(1);
          expect(result.data.limit).toBe(10);
        }
      });

      it('should reject invalid pagination parameters', () => {
        const invalidPagination = {
          page: 0, // Page must be >= 1
          limit: 101, // Limit must be <= 100
          order: 'invalid' // Order must be 'asc' or 'desc'
        };

        const result = schemas.pagination.safeParse(invalidPagination);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('XSS Prevention', () => {
    it('should remove script tags', () => {
      const maliciousSchema = z.object({
        content: z.string()
      });

      mockReq = {
        body: {
          content: '<script>alert("XSS")</script>Hello World'
        }
      };

      const middleware = validateAndSanitize(maliciousSchema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body.content).not.toContain('<script>');
      expect(mockReq.body.content).toBe('Hello World');
    });

    it('should remove onclick handlers', () => {
      const maliciousSchema = z.object({
        content: z.string()
      });

      mockReq = {
        body: {
          content: '<div onclick="alert(1)">Click me</div>'
        }
      };

      const middleware = validateAndSanitize(maliciousSchema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body.content).not.toContain('onclick');
      expect(mockReq.body.content).toBe('<div>Click me</div>');
    });

    it('should preserve safe HTML tags', () => {
      const safeSchema = z.object({
        content: z.string()
      });

      mockReq = {
        body: {
          content: '<p>This is <strong>safe</strong> HTML with <em>emphasis</em></p>'
        }
      };

      const middleware = validateAndSanitize(safeSchema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body.content).toContain('<p>');
      expect(mockReq.body.content).toContain('<strong>');
      expect(mockReq.body.content).toContain('<em>');
    });
  });

  describe('Data type conversion', () => {
    it('should convert string numbers to numbers when expected', () => {
      const numberSchema = z.object({
        age: z.coerce.number().min(0),
        count: z.coerce.number().optional()
      });

      mockReq = {
        body: {
          age: '25',
          count: '10'
        }
      };

      const middleware = validateAndSanitize(numberSchema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(typeof mockReq.body.age).toBe('number');
      expect(mockReq.body.age).toBe(25);
      expect(typeof mockReq.body.count).toBe('number');
      expect(mockReq.body.count).toBe(10);
    });

    it('should handle boolean conversion', () => {
      const booleanSchema = z.object({
        active: z.coerce.boolean(),
        public: z.coerce.boolean().optional()
      });

      mockReq = {
        body: {
          active: true,
          public: false
        }
      };

      const middleware = validateAndSanitize(booleanSchema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(typeof mockReq.body.active).toBe('boolean');
      expect(mockReq.body.active).toBe(true);
      expect(typeof mockReq.body.public).toBe('boolean');
      expect(mockReq.body.public).toBe(false);
    });
  });
});