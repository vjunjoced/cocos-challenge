import 'reflect-metadata';
import { validate } from 'class-validator';
import { IsAbsentWhen } from './is-absent-when.js';

class Sample {
  mode?: string;

  @IsAbsentWhen<Sample>((sample) => sample.mode === 'A')
  extra?: number;
}

const build = (values: Partial<Sample>) => Object.assign(new Sample(), values);

describe('IsAbsentWhen', () => {
  it('rechaza el campo cuando se cumple la condición', async () => {
    const errors = await validate(build({ mode: 'A', extra: 1 }));

    expect(errors[0]?.constraints).toHaveProperty('isAbsentWhen');
  });

  it('acepta el campo cuando no se cumple la condición', async () => {
    await expect(validate(build({ mode: 'B', extra: 1 }))).resolves.toEqual([]);
  });

  it('acepta que el campo no venga aunque se cumpla la condición', async () => {
    await expect(validate(build({ mode: 'A' }))).resolves.toEqual([]);
  });
});
