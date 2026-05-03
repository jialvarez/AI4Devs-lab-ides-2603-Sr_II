import { resolveSafeCvAbsolutePath } from '../lib/cvPath';

describe('resolveSafeCvAbsolutePath', () => {
  it('rechaza path traversal y rutas inválidas', () => {
    expect(resolveSafeCvAbsolutePath(null)).toBeNull();
    expect(resolveSafeCvAbsolutePath('')).toBeNull();
    expect(resolveSafeCvAbsolutePath('cvs/../secret.pdf')).toBeNull();
    expect(resolveSafeCvAbsolutePath('other/uuid.pdf')).toBeNull();
    expect(resolveSafeCvAbsolutePath('cvs')).toBeNull();
    expect(resolveSafeCvAbsolutePath('cvs/sub/x.pdf')).toBeNull();
    expect(resolveSafeCvAbsolutePath('cvs/bad.exe')).toBeNull();
  });
});
