import { z } from 'zod';

// z.date() can't be represented in JSON Schema, so spec generation fails on it.
// The wire side is an ISO string; handlers can still return a Date.
// DTOs using this need createZodDto(schema, { codec: true }) and a
// @ZodSerializerDto route, so the serializer calls .encode().
export const isoDate = z.codec(z.iso.datetime(), z.date(), {
  decode: (value) => new Date(value),
  encode: (value) => value.toISOString(),
});

// A bare z.string().nullable() emits type: ["string", "null"], which
// @nestjs/swagger misreads as string[], and the client gets `unknown`.
// The .meta() override emits the OpenAPI 3.0 form instead.
export const nullableString = () =>
  z.string().nullable().meta({ type: 'string', nullable: true });
