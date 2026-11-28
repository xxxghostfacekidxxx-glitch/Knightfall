"""Fixed public acceptance fixtures. No private inputs, no arbitrary code execution."""
import json
import pathlib
import subprocess
import sys
import tempfile
from importlib.metadata import version

def tree_sitter():
    from tree_sitter import Language, Parser
    import tree_sitter_python
    parser = Parser(Language(tree_sitter_python.language()))
    tree = parser.parse(b"def increment(x):\n    return x + 1\n")
    assert tree.root_node.type == "module" and not tree.root_node.has_error
    assert tree.root_node.named_children[0].type == "function_definition"
    assert parser.parse(b"def broken(:\n").root_node.has_error
    return {"version": version("tree-sitter"), "valid_and_invalid_parse": True}

def pyright():
    with tempfile.TemporaryDirectory() as tmp:
        p = pathlib.Path(tmp) / "fixture.py"
        p.write_text("def inc(x: int) -> int:\n    return x + 1\ninc(2)\n", encoding="utf-8")
        good = subprocess.run(["pyright", "--outputjson", str(p)], capture_output=True, text=True, timeout=90, cwd=tmp)
        assert good.returncode == 0, good.stderr + good.stdout
        p.write_text("def inc(x: int) -> int:\n    return 'wrong'\n", encoding="utf-8")
        bad = subprocess.run(["pyright", "--outputjson", str(p)], capture_output=True, text=True, timeout=90, cwd=tmp)
        assert bad.returncode == 1 and json.loads(bad.stdout)["summary"]["errorCount"] >= 1
        return {"version": version("pyright"), "valid_and_invalid_types": True}

def tokenizers():
    from tokenizers import Tokenizer, models, trainers, pre_tokenizers
    tok = Tokenizer(models.BPE(unk_token="[UNK]"))
    tok.pre_tokenizer = pre_tokenizers.Whitespace()
    tok.train_from_iterator(["compile code", "compile code safely", "test code", "test parsers"], trainers.BpeTrainer(vocab_size=64, special_tokens=["[UNK]"], show_progress=False))
    output = tok.encode("compile code")
    assert output.ids and "[UNK]" not in output.tokens
    assert Tokenizer.from_str(tok.to_str()).encode("compile code").ids == output.ids
    return {"version": version("tokenizers"), "vocab": tok.get_vocab_size(), "trained_and_serialized": True}

def wasmtime():
    from wasmtime import Config, Engine, Store, Module, Instance, Trap
    config = Config()
    config.consume_fuel = True
    engine = Engine(config)
    store = Store(engine)
    store.set_fuel(10000)
    mod = Module(engine, '(module (func (export "add") (param i32 i32) (result i32) local.get 0 local.get 1 i32.add))')
    assert Instance(store, mod, []).exports(store)["add"](store, 19, 23) == 42
    assert store.get_fuel() < 10000
    loop = Module(engine, '(module (func (export "spin") (loop br 0)))')
    store.set_fuel(100)
    try:
        Instance(store, loop, []).exports(store)["spin"](store)
        raise AssertionError("fuel limit failed")
    except Trap:
        pass
    return {"version": version("wasmtime"), "execution": 42, "fuel_limit": True}

def harness():
    from lm_eval.api import metrics
    from lm_eval.api.registry import get_aggregation
    mean = get_aggregation("mean")
    assert abs(mean([1.0, 0.0, 1.0, 1.0]) - 0.75) < 1e-9
    return {"version": version("lm-eval"), "metric_aggregation": 0.75}

engines = {"tree-sitter": tree_sitter, "pyright": pyright, "tokenizers": tokenizers, "wasmtime": wasmtime, "lm-evaluation-harness": harness}
if __name__ == "__main__":
    name = sys.argv[1]
    result = engines[name]()
    print(json.dumps({"engine": name, "status": "pass", **result}))
