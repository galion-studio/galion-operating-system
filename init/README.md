# galion-init

In-memory prototype of the Galion OS init. It prints a desktop boot plan and exits. It does not replace the host init, and it does not mount, bind a port, or play audio.

The design is [docs/galion-init.md](../docs/galion-init.md).

```
cargo test --manifest-path init/Cargo.toml --locked
```

Licence: the repository [LICENSE](../LICENSE).
