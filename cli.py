#!/usr/bin/env python3
"""CLI for testing contract analysis pipeline."""

import argparse
import json
import sys
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()

from src.pipeline import ContractPipeline


def analyze_single(args):
    """Analyze a single contract file."""
    pipeline = ContractPipeline()

    print(f"Analyzing: {args.file}")
    analysis = pipeline.analyze_file(args.file, save_to_db=not args.no_save)

    output = analysis.model_dump(mode="json")

    if args.output:
        Path(args.output).write_text(json.dumps(output, indent=2))
        print(f"Results saved to: {args.output}")
    else:
        print(json.dumps(output, indent=2))


def analyze_batch(args):
    """Analyze all contracts in a directory."""
    pipeline = ContractPipeline()

    print(f"Analyzing contracts in: {args.directory}")
    results = pipeline.analyze_directory(args.directory, pattern=args.pattern)

    print(f"\nProcessed {len(results)} contracts")

    summary = pipeline.db.get_summary()
    print(f"\nSummary:")
    print(f"  Total: {summary['total_contracts']}")
    print(f"  Red: {summary['by_risk_level']['red']}")
    print(f"  Yellow: {summary['by_risk_level']['yellow']}")
    print(f"  Green: {summary['by_risk_level']['green']}")
    print(f"  Expiring in 90 days: {summary['expiring_in_90_days']}")


def show_dashboard(args):
    """Show dashboard data."""
    pipeline = ContractPipeline()
    data = pipeline.get_dashboard_data()
    print(json.dumps(data, indent=2))


def main():
    parser = argparse.ArgumentParser(
        description="Contract Intelligence CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    single_parser = subparsers.add_parser("analyze", help="Analyze a single contract")
    single_parser.add_argument("file", help="Path to contract file (PDF, MD, or TXT)")
    single_parser.add_argument("-o", "--output", help="Output file for JSON results")
    single_parser.add_argument("--no-save", action="store_true", help="Don't save to database")
    single_parser.set_defaults(func=analyze_single)

    batch_parser = subparsers.add_parser("batch", help="Analyze all contracts in a directory")
    batch_parser.add_argument("directory", help="Directory containing contracts")
    batch_parser.add_argument("-p", "--pattern", default="*.md", help="File pattern (default: *.md)")
    batch_parser.set_defaults(func=analyze_batch)

    dashboard_parser = subparsers.add_parser("dashboard", help="Show dashboard data")
    dashboard_parser.set_defaults(func=show_dashboard)

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    args.func(args)


if __name__ == "__main__":
    main()
