import { registerDecorator } from 'class-validator';

/**
 * El campo no debe venir cuando `condition(objeto)` es verdadera. Si falla, el
 * código de error es `isAbsentWhen` (IS_ABSENT_WHEN en la respuesta).
 */
export function IsAbsentWhen<T extends object>(
  condition: (object: T) => boolean,
): PropertyDecorator {
  return (target, propertyName) => {
    registerDecorator({
      name: 'isAbsentWhen',
      target: target.constructor,
      propertyName: propertyName as string,
      validator: {
        validate: (value: unknown, args) =>
          value === undefined || !condition(args?.object as T),
      },
    });
  };
}
