import pytest

from llm import parse_json_content


def test_valid_json_parsed():
    assert parse_json_content('{"ingredients": []}') == {"ingredients": []}


def test_markdown_fenced_json_recovered():
    content = 'Here you go:\n```json\n{"ingredients": []}\n```\nEnjoy!'
    assert parse_json_content(content) == {"ingredients": []}


@pytest.mark.parametrize("content", [None, ""])
def test_empty_content_raises_value_error(content):
    with pytest.raises(ValueError, match="LLM response was empty"):
        parse_json_content(content)


def test_garbage_content_with_no_braces_raises_value_error():
    with pytest.raises(ValueError, match="LLM response was not valid JSON"):
        parse_json_content("this is not json at all")
